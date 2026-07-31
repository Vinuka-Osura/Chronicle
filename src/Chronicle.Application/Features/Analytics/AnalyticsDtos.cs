namespace Chronicle.Application.Features.Analytics;

/// <summary>
/// Engineering Analytics, as the page needs it.
/// </summary>
/// <remarks>
/// Deliberately not the <c>GitHubStats</c> port model. This carries derived figures the
/// UI wants and the port has no business computing - longest streak, the busiest day,
/// the calendar's own date range - and it keeps the public API contract free to change
/// independently of what GitHub happens to return.
/// </remarks>
/// <param name="IsLive">
/// False when GitHub has never been reached - no token, no username, or a first request
/// that failed. The page says "not connected" rather than presenting zeroes as facts.
/// </param>
public sealed record GitHubStatsDto(
    bool IsLive,
    DateTimeOffset FetchedAt,
    int ContributionsLastYear,
    int PublicRepos,
    int CurrentStreakDays,
    int LongestStreakDays,
    int BusiestDayCount,
    DateOnly? BusiestDay,
    DateOnly? CalendarFrom,
    DateOnly? CalendarTo,
    IReadOnlyList<ContributionDayDto> Calendar,
    IReadOnlyList<LanguageShareDto> Languages,
    LastCommitDto? LastCommit,
    IReadOnlyList<RepoSummaryDto> Repos);

public sealed record ContributionDayDto(DateOnly Date, int Count);

public sealed record LanguageShareDto(string Name, double Percent);

public sealed record LastCommitDto(string Message, string Repo, DateTimeOffset When);

/// <summary>A public repository, for the "what has been touched lately" readout.</summary>
public sealed record RepoSummaryDto(
    string Name,
    string? Language,
    DateTimeOffset PushedAt,
    string Url);
