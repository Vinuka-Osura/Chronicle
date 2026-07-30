using Chronicle.Application.Common.Interfaces;
using Chronicle.Application.Common.Models;
using MediatR;

namespace Chronicle.Application.Features.Analytics.Queries.GetGitHubStats;

/// <summary>
/// Shapes the cached GitHub payload for the Analytics page.
/// </summary>
/// <remarks>
/// No database access and no HTTP: <see cref="IGitHubService"/> owns both, and already
/// guarantees a value even when GitHub is unreachable. The work here is derivation -
/// figures a reader cares about that the API does not return.
/// </remarks>
public sealed class GetGitHubStatsQueryHandler(IGitHubService github, IDateTimeProvider clock)
    : IRequestHandler<GetGitHubStatsQuery, GitHubStatsDto>
{
    public async Task<GitHubStatsDto> Handle(
        GetGitHubStatsQuery request,
        CancellationToken cancellationToken)
    {
        var stats = await github.GetStatsAsync(cancellationToken).ConfigureAwait(false);

        var calendar = stats.ContributionCalendar
            .OrderBy(day => day.Date)
            .Select(day => new ContributionDayDto(day.Date, day.Count))
            .ToList();

        var busiest = calendar.Count == 0
            ? null
            : calendar.Aggregate((best, day) => day.Count > best.Count ? day : best);

        return new GitHubStatsDto(
            // An empty calendar and no repositories means we have never had an answer,
            // as opposed to genuinely having none.
            IsLive: calendar.Count > 0 || stats.PublicRepos > 0,
            FetchedAt: stats.FetchedAt,
            ContributionsLastYear: stats.TotalCommits,
            PublicRepos: stats.PublicRepos,
            CurrentStreakDays: CurrentStreak(calendar, DateOnly.FromDateTime(clock.UtcNow.UtcDateTime)),
            LongestStreakDays: LongestStreak(calendar),
            BusiestDayCount: busiest?.Count ?? 0,
            BusiestDay: busiest?.Count > 0 ? busiest.Date : null,
            CalendarFrom: calendar.Count > 0 ? calendar[0].Date : null,
            CalendarTo: calendar.Count > 0 ? calendar[^1].Date : null,
            Calendar: calendar,
            Languages: stats.TopLanguages
                .Select(language => new LanguageShareDto(language.Name, language.Percent))
                .ToList(),
            LastCommit: stats.LastCommit is { } commit
                ? new LastCommitDto(commit.Message, commit.Repo, commit.When)
                : null);
    }

    /// <summary>
    /// Consecutive contributing days counting back from today.
    /// </summary>
    /// <remarks>
    /// Today counts only once it has contributions. At 09:00 an empty today is a day
    /// still in progress rather than a broken streak, so the walk starts at yesterday
    /// instead - otherwise a genuine streak resets itself every midnight.
    /// </remarks>
    internal static int CurrentStreak(IReadOnlyList<ContributionDayDto> calendar, DateOnly today)
    {
        if (calendar.Count == 0)
        {
            return 0;
        }

        var byDate = calendar
            .GroupBy(day => day.Date)
            .ToDictionary(group => group.Key, group => group.Sum(day => day.Count));

        var cursor = byDate.GetValueOrDefault(today) > 0 ? today : today.AddDays(-1);
        var streak = 0;

        while (byDate.TryGetValue(cursor, out var count) && count > 0)
        {
            streak++;
            cursor = cursor.AddDays(-1);
        }

        return streak;
    }

    /// <summary>
    /// The longest run of consecutive contributing days in the calendar.
    /// </summary>
    /// <remarks>
    /// Walks dates rather than positions, so a calendar with a missing day breaks the
    /// run instead of silently joining either side of the gap.
    /// </remarks>
    internal static int LongestStreak(IReadOnlyList<ContributionDayDto> calendar)
    {
        var longest = 0;
        var run = 0;
        DateOnly? previous = null;

        foreach (var day in calendar)
        {
            if (day.Count == 0)
            {
                run = 0;
            }
            else
            {
                run = previous is { } last && day.Date == last.AddDays(1) ? run + 1 : 1;
                longest = Math.Max(longest, run);
            }

            previous = day.Date;
        }

        return longest;
    }
}
