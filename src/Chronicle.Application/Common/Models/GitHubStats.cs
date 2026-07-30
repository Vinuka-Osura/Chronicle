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
    DateTimeOffset FetchedAt)
{
    /// <summary>Served when GitHub has never been reached, so the UI has something honest to render.</summary>
    public static GitHubStats Empty(DateTimeOffset fetchedAt) =>
        new(0, 0, [], [], null, fetchedAt);
}

public sealed record ContributionDay(DateOnly Date, int Count);

public sealed record LanguageShare(string Name, double Percent);

public sealed record LastCommit(string Message, string Repo, DateTimeOffset When);
