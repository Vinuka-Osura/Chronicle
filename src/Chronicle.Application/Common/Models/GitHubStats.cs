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
    IReadOnlyList<RepoSummary>? RecentRepos = null,
    ContributionBreakdown? Breakdown = null,
    IReadOnlyList<YearTotal>? ContributionYears = null,
    IReadOnlyList<ContributedRepo>? ContributedTo = null,
    IReadOnlyList<RepoCommits>? CommitsByRepo = null)
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

    /// <summary>What the year's contributions were actually made of. Null on an old payload.</summary>
    public ContributionBreakdown? Breakdown { get; init; } = Breakdown;

    /// <summary>Totals per year, newest first, for the whole life of the account.</summary>
    public IReadOnlyList<YearTotal> ContributionYears { get; init; } = ContributionYears ?? [];

    /// <summary>Other people's repositories this account has contributed to.</summary>
    public IReadOnlyList<ContributedRepo> ContributedTo { get; init; } = ContributedTo ?? [];

    /// <summary>Where the year's commits went, private repositories included as a count.</summary>
    public IReadOnlyList<RepoCommits> CommitsByRepo { get; init; } = CommitsByRepo ?? [];

    /// <summary>Served when GitHub has never been reached, so the UI has something honest to render.</summary>
    public static GitHubStats Empty(DateTimeOffset fetchedAt) =>
        new(0, 0, [], [], null, fetchedAt);
}

/// <summary>
/// What the contribution total is actually made of, over the same window as the calendar.
/// </summary>
/// <remarks>
/// <para>
/// The headline "contributions" number is four different activities added together, and
/// a reader cannot tell a year of commits from a year of code review by looking at it.
/// These are the parts.
/// </para>
/// <para>
/// <see cref="PrivateContributions"/> is GitHub's <c>restrictedContributionsCount</c> — work
/// in repositories the viewer cannot see. It is **zero unless the account owner has turned
/// on "Include private contributions on my profile"**, which is the whole reason it can be
/// shown at all: the number is published by the person it describes, deliberately, and it
/// reveals a count and nothing else. No repository name, no commit message, no employer.
/// </para>
/// </remarks>
public sealed record ContributionBreakdown(
    int Commits,
    int PullRequests,
    int Reviews,
    int Issues,
    int PrivateContributions,
    bool HasPrivateContributions,
    int RepositoriesCommittedTo);

/// <summary>One year of the account's life, for the all-time view.</summary>
public sealed record YearTotal(int Year, int Contributions);

/// <summary>
/// A repository belonging to somebody else that this account has contributed to.
/// </summary>
/// <remarks>
/// The strongest claim on the page, and the hardest to fake: a merged pull request into a
/// project you do not own is a third party agreeing your work was good enough to keep.
/// </remarks>
public sealed record ContributedRepo(
    string NameWithOwner,
    string Url,
    string? Description,
    int Stars,
    string? Language);

/// <summary>
/// How many commits went to one repository this year.
/// </summary>
/// <param name="IsPrivate">
/// True for a repository the reader cannot open. The name is still carried because the
/// token's owner can see it — the DTO layer is what decides whether to publish it, and it
/// does not.
/// </param>
public sealed record RepoCommits(
    string NameWithOwner,
    string? Url,
    int Commits,
    bool IsPrivate,
    bool IsFork);

public sealed record ContributionDay(DateOnly Date, int Count);

public sealed record LanguageShare(string Name, double Percent);

public sealed record LastCommit(string Message, string Repo, DateTimeOffset When);

/// <summary>One public repository, as much of it as the site has any use for.</summary>
public sealed record RepoSummary(
    string Name,
    string? Language,
    DateTimeOffset PushedAt,
    string Url);
