namespace Chronicle.Application.Common.Models;

/// <summary>
/// What GitHub said, shaped and cached. Backs the Analytics page and the Mission
/// Control strip.
/// </summary>
/// <remarks>
/// Deliberately only fetched facts. Anything derived from them - streaks, the busiest
/// day, the calendar's range - is computed by the query handler at read time, so the
/// derivations stay testable without a network or a database, and changing one does not
/// mean waiting for every cached payload to expire.
/// </remarks>
public sealed record GitHubStats(
    int TotalCommits,
    int PublicRepos,
    IReadOnlyList<ContributionDay> ContributionCalendar,
    IReadOnlyList<LanguageShare> TopLanguages,
    LastCommit? LastCommit,
    DateTimeOffset FetchedAt,
    IReadOnlyList<RepoSummary>? RecentRepos = null)
{
    /// <summary>
    /// The most recently pushed public repositories.
    /// </summary>
    /// <remarks>
    /// Optional with a null default on purpose. The payload is cached as JSON in a single
    /// row, so a cache written before this field existed deserialises with it missing -
    /// and a required member would make every old payload throw instead of simply
    /// carrying less. Read it through this property, never the parameter.
    /// </remarks>
    public IReadOnlyList<RepoSummary> RecentRepos { get; init; } = RecentRepos ?? [];

    /// <summary>Served when GitHub has never been reached, so the UI has something honest to render.</summary>
    public static GitHubStats Empty(DateTimeOffset fetchedAt) =>
        new(0, 0, [], [], null, fetchedAt);
}

public sealed record ContributionDay(DateOnly Date, int Count);

public sealed record LanguageShare(string Name, double Percent);

public sealed record LastCommit(string Message, string Repo, DateTimeOffset When);

/// <summary>One public repository, as much of it as the site has any use for.</summary>
public sealed record RepoSummary(
    string Name,
    string? Language,
    DateTimeOffset PushedAt,
    string Url);
