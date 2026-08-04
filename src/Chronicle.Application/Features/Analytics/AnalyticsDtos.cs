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
    IReadOnlyList<RepoSummaryDto> Repos,
    ContributionBreakdownDto? Breakdown,
    IReadOnlyList<WeekDto> Weekly,
    IReadOnlyList<YearTotalDto> Years,
    IReadOnlyList<DayOfWeekDto> ByDayOfWeek,
    IReadOnlyList<ContributedRepoDto> ContributedTo,
    int ActiveDays,
    int CalendarDays,
    int LongestGapDays);

/// <summary>
/// What the headline contribution number is actually made of.
/// </summary>
/// <remarks>
/// These four sum to the year's total, which is what makes a stacked or proportional
/// reading of them honest — unlike most figures on this page, there is a real denominator.
/// </remarks>
public sealed record ContributionBreakdownDto(
    int Commits,
    int PullRequests,
    int Reviews,
    int Issues,
    int PrivateContributions,
    bool HasPrivateContributions,
    int RepositoriesCommittedTo,
    int PrivateRepositoriesCommittedTo);

/// <param name="WeekStart">The Monday the week begins on.</param>
/// <param name="Mean">
/// Four-week trailing mean. Null for the first three weeks, where there is not enough
/// history to average — a mean drawn over one week is that week wearing a disguise.
/// </param>
public sealed record WeekDto(DateOnly WeekStart, int Total, double? Mean);

public sealed record YearTotalDto(int Year, int Contributions);

/// <param name="Mean">Contributions per occurrence of this weekday, so a year with 53 Mondays does not read high.</param>
public sealed record DayOfWeekDto(string Day, int Total, double Mean);

public sealed record ContributedRepoDto(
    string NameWithOwner,
    string Url,
    string? Description,
    int Stars,
    string? Language);

public sealed record ContributionDayDto(DateOnly Date, int Count);

public sealed record LanguageShareDto(string Name, double Percent);

public sealed record LastCommitDto(string Message, string Repo, DateTimeOffset When);

/// <summary>A public repository, for the "what has been touched lately" readout.</summary>
public sealed record RepoSummaryDto(
    string Name,
    string? Language,
    DateTimeOffset PushedAt,
    string Url);
