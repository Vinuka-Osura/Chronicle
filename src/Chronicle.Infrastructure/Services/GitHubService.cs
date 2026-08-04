using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Chronicle.Application.Common.Interfaces;
using Chronicle.Application.Common.Models;
using Chronicle.Domain.Entities;
using Chronicle.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Chronicle.Infrastructure.Services;

/// <summary>
/// Fetches GitHub activity and caches the shaped result in a single database row.
/// </summary>
/// <remarks>
/// <para>
/// The public site never calls GitHub. It reads this row, which is refreshed at most
/// once every <see cref="GitHubOptions.RefreshInterval"/> by whichever request happens
/// to find it stale. That is three separate wins: a visitor's page load never waits on a
/// third party, the rate limit is spent per site rather than per visitor, and the token
/// stays on the server.
/// </para>
/// <para>
/// <b>Every failure path returns the last good payload.</b> An analytics page showing
/// figures from this morning is worth far more than one showing an error, and GitHub
/// being unreachable is not something a reader can act on.
/// </para>
/// </remarks>
public sealed class GitHubService(
    HttpClient http,
    ChronicleDbContext db,
    IDateTimeProvider clock,
    IOptions<GitHubOptions> options,
    ILogger<GitHubService> logger) : IGitHubService
{
    /// <summary>
    /// Serialises refreshes across the process. Without it, a burst of traffic arriving
    /// just after the payload expires sends one GitHub request per visitor - the exact
    /// stampede the cache exists to prevent.
    /// </summary>
    private static readonly SemaphoreSlim RefreshGate = new(1, 1);

    private static readonly JsonSerializerOptions PayloadJson = new(JsonSerializerDefaults.Web);

    private readonly GitHubOptions _options = options.Value;

    public async Task<GitHubStats> GetStatsAsync(CancellationToken cancellationToken = default)
    {
        var now = clock.UtcNow;

        var cache = await db.GitHubStatsCaches
            .FirstOrDefaultAsync(c => c.Id == GitHubStatsCache.SingletonId, cancellationToken)
            .ConfigureAwait(false);

        var cached = Deserialise(cache);

        if (!_options.IsConfigured)
        {
            GitHubLog.NotConfigured(logger);
            return cached ?? GitHubStats.Empty(now);
        }

        if (cached is not null && now - cache!.FetchedAt < _options.RefreshInterval)
        {
            return cached;
        }

        await RefreshGate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            // Re-read inside the gate: while this request was queuing, the one ahead of
            // it may already have done the work. A tracked entity needs reloading rather
            // than re-querying, because the identity map would hand back the stale copy;
            // an absent one needs the query, or a second insert races the first.
            if (cache is not null)
            {
                await db.Entry(cache).ReloadAsync(cancellationToken).ConfigureAwait(false);
            }
            else
            {
                cache = await db.GitHubStatsCaches
                    .FirstOrDefaultAsync(c => c.Id == GitHubStatsCache.SingletonId, cancellationToken)
                    .ConfigureAwait(false);
            }

            var current = Deserialise(cache);
            if (current is not null && clock.UtcNow - cache!.FetchedAt < _options.RefreshInterval)
            {
                return current;
            }

            var fresh = await FetchAsync(cancellationToken).ConfigureAwait(false);
            if (fresh is null)
            {
                // Deliberately do not stamp FetchedAt on failure. Leaving the row stale
                // means the next request retries rather than waiting out a full interval
                // because of one bad minute.
                return cached ?? GitHubStats.Empty(now);
            }

            await StoreAsync(cache, fresh, cancellationToken).ConfigureAwait(false);
            return fresh;
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
        {
            GitHubLog.RefreshFailed(logger, ex);
            return cached ?? GitHubStats.Empty(now);
        }
        finally
        {
            RefreshGate.Release();
        }
    }

    // -----------------------------------------------------------------------
    // Fetch
    // -----------------------------------------------------------------------

    /// <summary>How many repository names the public site has any use for.</summary>
    private const int RecentRepoLimit = 6;

    private async Task<GitHubStats?> FetchAsync(CancellationToken cancellationToken)
    {
        var repos = await FetchReposAsync(cancellationToken).ConfigureAwait(false);
        if (repos is null)
        {
            return null;
        }

        var contributions = _options.CanQueryGraphQl
            ? await FetchContributionsAsync(cancellationToken).ConfigureAwait(false)
            : ContributionPayload.None;

        // A second GraphQL request, and only when the first one told us which years exist.
        // Both cost one point against a 5,000/hour budget, four times a day.
        var years = contributions.Years.Count > 0
            ? await FetchYearTotalsAsync(contributions.Years, cancellationToken).ConfigureAwait(false)
            : [];

        var calendar = contributions.Calendar;
        var languages = await FetchLanguagesAsync(repos, cancellationToken).ConfigureAwait(false);
        var lastCommit = await FetchLastCommitAsync(cancellationToken).ConfigureAwait(false);

        return new GitHubStats(
            TotalCommits: calendar.Sum(d => d.Count),
            PublicRepos: repos.Count,
            ContributionCalendar: calendar,
            TopLanguages: languages,
            LastCommit: lastCommit,
            FetchedAt: clock.UtcNow,
            // Already sorted by most recently pushed, so this is the top of that list and
            // needs no extra request. Capped because the site shows a handful, and a
            // hundred repository names in a cached payload is weight nobody reads.
            RecentRepos: repos
                .Take(RecentRepoLimit)
                .Select(r => new Application.Common.Models.RepoSummary(
                    r.Name,
                    string.IsNullOrWhiteSpace(r.Language) ? null : r.Language,
                    r.PushedAt,
                    r.HtmlUrl))
                .ToList(),
            Breakdown: contributions.Breakdown,
            ContributionYears: years,
            ContributedTo: contributions.ContributedTo,
            CommitsByRepo: contributions.CommitsByRepo);
    }

    /// <summary>Public, non-fork repositories, most recently pushed first.</summary>
    private async Task<List<RepoSummary>?> FetchReposAsync(CancellationToken cancellationToken)
    {
        var response = await http
            .GetAsync(
                $"users/{Uri.EscapeDataString(_options.Username)}/repos?per_page=100&sort=pushed&type=owner",
                cancellationToken)
            .ConfigureAwait(false);

        if (!response.IsSuccessStatusCode)
        {
            GitHubLog.RequestFailed(logger, "repos", (int)response.StatusCode);
            return null;
        }

        var repos = await response.Content
            .ReadFromJsonAsync<List<RepoSummary>>(cancellationToken)
            .ConfigureAwait(false);

        // Forks are someone else's work; counting them would overstate both the
        // repository total and the language mix.
        return repos?.Where(r => r is { Fork: false, Private: false }).ToList() ?? [];
    }

    /// <summary>Everything one GraphQL round trip can answer about the last year.</summary>
    private sealed record ContributionPayload(
        IReadOnlyList<ContributionDay> Calendar,
        ContributionBreakdown? Breakdown,
        IReadOnlyList<int> Years,
        IReadOnlyList<ContributedRepo> ContributedTo,
        IReadOnlyList<RepoCommits> CommitsByRepo)
    {
        public static readonly ContributionPayload None = new([], null, [], [], []);
    }

    /// <summary>
    /// The contribution calendar and everything around it, which exists only on the
    /// authenticated GraphQL API - there is no REST equivalent, and the SVG on a profile
    /// page is not a contract.
    /// </summary>
    /// <remarks>
    /// <para>
    /// One request for all of it. Each of these was a separate candidate endpoint and every
    /// one of them is a field on the same <c>contributionsCollection</c>, so asking for them
    /// together costs exactly what asking for the calendar alone used to: one point.
    /// </para>
    /// <para>
    /// <c>restrictedContributionsCount</c> is the private-work figure. It returns zero unless
    /// the account owner has enabled "Include private contributions on my profile" — which is
    /// precisely what makes it publishable: the count is disclosed by the person it describes,
    /// and it carries no repository name, commit message or employer with it.
    /// </para>
    /// </remarks>
    private async Task<ContributionPayload> FetchContributionsAsync(CancellationToken cancellationToken)
    {
        const string GraphQlQuery = """
            query($login: String!) {
              user(login: $login) {
                contributionsCollection {
                  contributionYears
                  totalCommitContributions
                  totalPullRequestContributions
                  totalPullRequestReviewContributions
                  totalIssueContributions
                  totalRepositoriesWithContributedCommits
                  restrictedContributionsCount
                  hasAnyRestrictedContributions
                  contributionCalendar {
                    weeks { contributionDays { date contributionCount } }
                  }
                  commitContributionsByRepository(maxRepositories: 25) {
                    repository { nameWithOwner url isPrivate isFork }
                    contributions { totalCount }
                  }
                }
                repositoriesContributedTo(
                  first: 12
                  includeUserRepositories: false
                  privacy: PUBLIC
                  contributionTypes: [COMMIT, PULL_REQUEST, PULL_REQUEST_REVIEW]
                  orderBy: { field: STARGAZERS, direction: DESC }
                ) {
                  nodes {
                    nameWithOwner
                    url
                    description
                    stargazerCount
                    primaryLanguage { name }
                  }
                }
              }
            }
            """;

        var user = await QueryAsync(
                GraphQlQuery,
                new { login = _options.Username },
                "graphql/contributions",
                cancellationToken)
            .ConfigureAwait(false);

        if (user is not { } root || !root.TryGetProperty("contributionsCollection", out var collection))
        {
            return ContributionPayload.None;
        }

        var days = new List<ContributionDay>(400);

        foreach (var week in collection
            .GetProperty("contributionCalendar")
            .GetProperty("weeks")
            .EnumerateArray())
        {
            foreach (var day in week.GetProperty("contributionDays").EnumerateArray())
            {
                if (DateOnly.TryParse(day.GetProperty("date").GetString(), out var date))
                {
                    days.Add(new ContributionDay(date, day.GetProperty("contributionCount").GetInt32()));
                }
            }
        }

        var breakdown = new ContributionBreakdown(
            Commits: Int(collection, "totalCommitContributions"),
            PullRequests: Int(collection, "totalPullRequestContributions"),
            Reviews: Int(collection, "totalPullRequestReviewContributions"),
            Issues: Int(collection, "totalIssueContributions"),
            PrivateContributions: Int(collection, "restrictedContributionsCount"),
            HasPrivateContributions:
                collection.TryGetProperty("hasAnyRestrictedContributions", out var restricted)
                && restricted.ValueKind is JsonValueKind.True,
            RepositoriesCommittedTo: Int(collection, "totalRepositoriesWithContributedCommits"));

        var years = collection.TryGetProperty("contributionYears", out var yearList)
            ? yearList.EnumerateArray().Select(y => y.GetInt32()).ToList()
            : [];

        var commitsByRepo = new List<RepoCommits>();

        if (collection.TryGetProperty("commitContributionsByRepository", out var byRepo))
        {
            foreach (var entry in byRepo.EnumerateArray())
            {
                var repository = entry.GetProperty("repository");

                commitsByRepo.Add(new RepoCommits(
                    NameWithOwner: repository.GetProperty("nameWithOwner").GetString() ?? "",
                    Url: repository.TryGetProperty("url", out var url) ? url.GetString() : null,
                    Commits: Int(entry.GetProperty("contributions"), "totalCount"),
                    IsPrivate: repository.GetProperty("isPrivate").ValueKind is JsonValueKind.True,
                    IsFork: repository.GetProperty("isFork").ValueKind is JsonValueKind.True));
            }
        }

        var contributedTo = new List<ContributedRepo>();

        if (root.TryGetProperty("repositoriesContributedTo", out var contributed)
            && contributed.TryGetProperty("nodes", out var nodes))
        {
            foreach (var node in nodes.EnumerateArray())
            {
                if (node.ValueKind is JsonValueKind.Null)
                {
                    continue;
                }

                contributedTo.Add(new ContributedRepo(
                    NameWithOwner: node.GetProperty("nameWithOwner").GetString() ?? "",
                    Url: node.GetProperty("url").GetString() ?? "",
                    Description: node.TryGetProperty("description", out var description)
                        ? description.GetString()
                        : null,
                    Stars: Int(node, "stargazerCount"),
                    Language: node.TryGetProperty("primaryLanguage", out var language)
                        && language.ValueKind is not JsonValueKind.Null
                        ? language.GetProperty("name").GetString()
                        : null));
            }
        }

        return new ContributionPayload(days, breakdown, years, contributedTo, commitsByRepo);
    }

    /// <summary>
    /// One total per year for the whole life of the account.
    /// </summary>
    /// <remarks>
    /// GraphQL has no "group by year", so each year is a separate aliased
    /// <c>contributionsCollection</c> in one document. That is still a single request and a
    /// single point — the alternative, one request per year, would be a dozen.
    /// </remarks>
    private async Task<IReadOnlyList<YearTotal>> FetchYearTotalsAsync(
        IReadOnlyList<int> years,
        CancellationToken cancellationToken)
    {
        // Newest first from GitHub. Capped because a fifteen-year-old account is a wide
        // chart nobody reads the left-hand end of.
        var wanted = years.Take(10).ToList();

        var fields = string.Join(
            "\n",
            wanted.Select(year =>
                $$"""
                  y{{year}}: contributionsCollection(from: "{{year}}-01-01T00:00:00Z", to: "{{year}}-12-31T23:59:59Z") {
                    contributionCalendar { totalContributions }
                  }
                """));

        var query = $$"""
            query($login: String!) {
              user(login: $login) {
            {{fields}}
              }
            }
            """;

        var user = await QueryAsync(
                query,
                new { login = _options.Username },
                "graphql/years",
                cancellationToken)
            .ConfigureAwait(false);

        if (user is not { } root)
        {
            return [];
        }

        var totals = new List<YearTotal>(wanted.Count);

        foreach (var year in wanted)
        {
            if (root.TryGetProperty($"y{year}", out var collection)
                && collection.ValueKind is not JsonValueKind.Null)
            {
                totals.Add(new YearTotal(
                    year,
                    Int(collection.GetProperty("contributionCalendar"), "totalContributions")));
            }
        }

        // Oldest first, because a series read left to right is a series that runs forwards.
        totals.Reverse();
        return totals;
    }

    /// <summary>
    /// Posts a GraphQL document and returns the <c>data.user</c> element, or null.
    /// </summary>
    /// <remarks>
    /// The element is cloned out of the <see cref="JsonDocument"/> before it is disposed.
    /// A <see cref="JsonElement"/> is a view over the document's buffer, so returning one
    /// from inside a <c>using</c> hands the caller a window onto memory that has already
    /// been returned to the pool.
    /// </remarks>
    private async Task<JsonElement?> QueryAsync(
        string query,
        object variables,
        string label,
        CancellationToken cancellationToken)
    {
        var response = await http
            .PostAsJsonAsync("graphql", new { query, variables }, cancellationToken)
            .ConfigureAwait(false);

        if (!response.IsSuccessStatusCode)
        {
            GitHubLog.RequestFailed(logger, label, (int)response.StatusCode);
            return null;
        }

        using var document = await JsonDocument
            .ParseAsync(
                await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false),
                cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        // GraphQL answers 200 with an errors array when the query is fine but the token
        // is not, so the status code alone does not mean success.
        if (document.RootElement.TryGetProperty("errors", out var errors))
        {
            GitHubLog.GraphQlRejected(logger, errors.ToString());
            return null;
        }

        if (!document.RootElement.TryGetProperty("data", out var data)
            || data.ValueKind is JsonValueKind.Null
            || !data.TryGetProperty("user", out var user)
            || user.ValueKind is JsonValueKind.Null)
        {
            return null;
        }

        return user.Clone();
    }

    /// <summary>An int property, or zero when GitHub omitted it.</summary>
    private static int Int(JsonElement element, string property) =>
        element.TryGetProperty(property, out var value) && value.ValueKind is JsonValueKind.Number
            ? value.GetInt32()
            : 0;

    /// <summary>
    /// True byte counts per language, which needs one request per repository - so it is
    /// capped at the most recently pushed <see cref="GitHubOptions.LanguageRepoLimit"/>.
    /// A repository last touched three years ago says little about what someone works in
    /// now, and the whole list would cost a hundred requests per refresh.
    /// </summary>
    private async Task<IReadOnlyList<LanguageShare>> FetchLanguagesAsync(
        List<RepoSummary> repos,
        CancellationToken cancellationToken)
    {
        var totals = new Dictionary<string, long>(StringComparer.Ordinal);

        foreach (var repo in repos.Take(_options.LanguageRepoLimit))
        {
            var response = await http
                .GetAsync($"repos/{repo.FullName}/languages", cancellationToken)
                .ConfigureAwait(false);

            // One repository that will not answer - renamed, or the rate limit reached
            // partway through - should cost that repository's bytes, not the whole
            // refresh. The bar is a slightly incomplete language mix, not no page.
            if (!response.IsSuccessStatusCode)
            {
                GitHubLog.RequestFailed(logger, $"languages/{repo.Name}", (int)response.StatusCode);
                continue;
            }

            var breakdown = await response.Content
                .ReadFromJsonAsync<Dictionary<string, long>>(cancellationToken)
                .ConfigureAwait(false);

            if (breakdown is null)
            {
                continue;
            }

            foreach (var (language, bytes) in breakdown)
            {
                totals[language] = totals.GetValueOrDefault(language) + bytes;
            }
        }

        var grandTotal = totals.Values.Sum();
        if (grandTotal == 0)
        {
            return [];
        }

        return totals
            .OrderByDescending(pair => pair.Value)
            .Take(8)
            .Select(pair => new LanguageShare(
                pair.Key,
                Math.Round(pair.Value * 100d / grandTotal, 1)))
            .ToList();
    }

    /// <summary>
    /// The most recent push, from the public events feed rather than GraphQL, so the
    /// Mission Control strip still shows something live without a token configured.
    /// </summary>
    private async Task<LastCommit?> FetchLastCommitAsync(CancellationToken cancellationToken)
    {
        var response = await http
            .GetAsync(
                $"users/{Uri.EscapeDataString(_options.Username)}/events/public?per_page=30",
                cancellationToken)
            .ConfigureAwait(false);

        if (!response.IsSuccessStatusCode)
        {
            GitHubLog.RequestFailed(logger, "events", (int)response.StatusCode);
            return null;
        }

        using var document = await JsonDocument
            .ParseAsync(
                await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false),
                cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        foreach (var evt in document.RootElement.EnumerateArray())
        {
            if (evt.GetProperty("type").GetString() != "PushEvent")
            {
                continue;
            }

            var commits = evt.GetProperty("payload").GetProperty("commits");
            if (commits.GetArrayLength() == 0)
            {
                continue;
            }

            // A push carries its commits oldest-first, so the newest is the last one.
            var message = commits[commits.GetArrayLength() - 1].GetProperty("message").GetString();
            if (string.IsNullOrWhiteSpace(message))
            {
                continue;
            }

            return new LastCommit(
                FirstLine(message),
                // The events feed names repositories "owner/repo". The owner is always
                // the profile being displayed, so repeating it in the status strip adds
                // length without adding information.
                WithoutOwner(evt.GetProperty("repo").GetProperty("name").GetString()),
                evt.GetProperty("created_at").GetDateTimeOffset());
        }

        return null;
    }

    // -----------------------------------------------------------------------
    // Derivation and storage
    // -----------------------------------------------------------------------

    private static string WithoutOwner(string? fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName))
        {
            return "unknown";
        }

        var slash = fullName.IndexOf('/', StringComparison.Ordinal);
        return slash >= 0 && slash < fullName.Length - 1 ? fullName[(slash + 1)..] : fullName;
    }

    private static string FirstLine(string message)
    {
        var line = message.AsSpan();
        var breakAt = line.IndexOfAny('\r', '\n');
        if (breakAt >= 0)
        {
            line = line[..breakAt];
        }

        return line.Length > 120 ? string.Concat(line[..117], "...") : line.ToString();
    }

    private static GitHubStats? Deserialise(GitHubStatsCache? cache)
    {
        if (cache is null || string.IsNullOrWhiteSpace(cache.PayloadJson) || cache.PayloadJson == "{}")
        {
            return null;
        }

        try
        {
            return JsonSerializer.Deserialize<GitHubStats>(cache.PayloadJson, PayloadJson);
        }
        catch (JsonException)
        {
            // A payload written by an older shape of this record. Treat it as absent and
            // let the next refresh replace it, rather than failing the page over it.
            return null;
        }
    }

    private async Task StoreAsync(
        GitHubStatsCache? cache,
        GitHubStats stats,
        CancellationToken cancellationToken)
    {
        var payload = JsonSerializer.Serialize(stats, PayloadJson);

        if (cache is null)
        {
            db.GitHubStatsCaches.Add(new GitHubStatsCache
            {
                Id = GitHubStatsCache.SingletonId,
                PayloadJson = payload,
                FetchedAt = stats.FetchedAt
            });
        }
        else
        {
            cache.PayloadJson = payload;
            cache.FetchedAt = stats.FetchedAt;
        }

        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        GitHubLog.Refreshed(logger, stats.PublicRepos, stats.ContributionCalendar.Count);
    }

    /// <summary>
    /// Only the repository fields this service actually reads.
    /// </summary>
    /// <remarks>
    /// <c>full_name</c> needs naming explicitly: GitHub's JSON is snake_case and the web
    /// defaults used by <c>ReadFromJsonAsync</c> are camelCase, so it binds to null
    /// otherwise - and a null there silently becomes the URL <c>repos//languages</c>,
    /// which 404s and takes the whole refresh down with it.
    /// </remarks>
    private sealed record RepoSummary(
        string Name,
        [property: JsonPropertyName("full_name")] string FullName,
        bool Fork,
        bool Private,
        // Nullable because a repository with no code in it yet reports no language, and
        // that is a normal state rather than a failure to parse.
        string? Language = null,
        [property: JsonPropertyName("pushed_at")] DateTimeOffset PushedAt = default,
        [property: JsonPropertyName("html_url")] string HtmlUrl = "");
}

/// <summary>Source-generated log messages (CA1848).</summary>
internal static partial class GitHubLog
{
    [LoggerMessage(
        EventId = 3001,
        Level = LogLevel.Debug,
        Message = "GitHub username is not configured; serving the cached or empty payload.")]
    public static partial void NotConfigured(ILogger logger);

    [LoggerMessage(
        EventId = 3002,
        Level = LogLevel.Warning,
        Message = "GitHub {Resource} responded {StatusCode}; keeping the cached payload.")]
    public static partial void RequestFailed(ILogger logger, string resource, int statusCode);

    [LoggerMessage(
        EventId = 3003,
        Level = LogLevel.Warning,
        Message = "GitHub GraphQL returned errors: {Errors}")]
    public static partial void GraphQlRejected(ILogger logger, string errors);

    [LoggerMessage(
        EventId = 3004,
        Level = LogLevel.Warning,
        Message = "GitHub refresh failed; keeping the cached payload.")]
    public static partial void RefreshFailed(ILogger logger, Exception exception);

    [LoggerMessage(
        EventId = 3005,
        Level = LogLevel.Information,
        Message = "GitHub stats refreshed: {RepoCount} repositories, {CalendarDays} calendar days.")]
    public static partial void Refreshed(ILogger logger, int repoCount, int calendarDays);
}
