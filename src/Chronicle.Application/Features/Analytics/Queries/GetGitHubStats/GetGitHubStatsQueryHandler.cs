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
                : null,
            Repos: stats.RecentRepos
                .Select(repo => new RepoSummaryDto(repo.Name, repo.Language, repo.PushedAt, repo.Url))
                .ToList(),
            Breakdown: Breakdown(stats),
            Weekly: Weekly(calendar),
            Years: stats.ContributionYears
                .Select(year => new YearTotalDto(year.Year, year.Contributions))
                .ToList(),
            ByDayOfWeek: ByDayOfWeek(calendar),
            ContributedTo: stats.ContributedTo
                .Select(repo => new ContributedRepoDto(
                    repo.NameWithOwner,
                    repo.Url,
                    repo.Description,
                    repo.Stars,
                    repo.Language))
                .ToList(),
            ActiveDays: calendar.Count(day => day.Count > 0),
            CalendarDays: calendar.Count,
            LongestGapDays: LongestGap(calendar));
    }

    /// <summary>
    /// The contribution mix, with the private repositories counted but never named.
    /// </summary>
    /// <remarks>
    /// <c>CommitsByRepo</c> carries private repository names — the token's owner can see
    /// them, so GitHub returns them. This is the boundary where that stops: only the count
    /// crosses into the DTO. A private repository name is frequently a client's name or an
    /// unannounced product, and publishing it because it was technically in the payload is
    /// exactly the kind of leak nobody notices until it matters.
    /// </remarks>
    private static ContributionBreakdownDto? Breakdown(GitHubStats stats)
    {
        if (stats.Breakdown is not { } breakdown)
        {
            return null;
        }

        return new ContributionBreakdownDto(
            breakdown.Commits,
            breakdown.PullRequests,
            breakdown.Reviews,
            breakdown.Issues,
            breakdown.PrivateContributions,
            breakdown.HasPrivateContributions,
            breakdown.RepositoriesCommittedTo,
            breakdown.PrivateRepositoriesCommittedTo);
    }

    /// <summary>How many days in the window fall in each trailing-mean window.</summary>
    private const int MeanWeeks = 4;

    /// <summary>
    /// The calendar collapsed into weeks, with a four-week trailing mean.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Weeks rather than days because 365 bars is texture, not a trend — the heatmap
    /// already shows the daily grain, and this is the shape of the year beside it.
    /// </para>
    /// <para>
    /// The first and last weeks are almost always partial: GitHub's calendar starts and
    /// ends mid-week. They are kept, because dropping them silently loses real
    /// contributions, and the chart labels its own range rather than pretending every
    /// bucket is seven days.
    /// </para>
    /// </remarks>
    internal static IReadOnlyList<WeekDto> Weekly(IReadOnlyList<ContributionDayDto> calendar)
    {
        if (calendar.Count == 0)
        {
            return [];
        }

        var buckets = calendar
            .GroupBy(day => day.Date.AddDays(-(((int)day.Date.DayOfWeek + 6) % 7)))
            .OrderBy(group => group.Key)
            .Select(group => (Start: group.Key, Total: group.Sum(day => day.Count)))
            .ToList();

        return [.. buckets.Select((bucket, index) => new WeekDto(
            bucket.Start,
            bucket.Total,
            // Null until there is a full window. An average over one week is that week.
            index + 1 < MeanWeeks
                ? null
                : buckets.Skip(index + 1 - MeanWeeks).Take(MeanWeeks).Average(b => b.Total)))];
    }

    /// <summary>
    /// Totals per weekday, and the per-occurrence mean.
    /// </summary>
    /// <remarks>
    /// The mean is the honest one. A 365-day window contains 53 of one weekday and 52 of
    /// the others, so raw totals hand one arbitrary day a 2% advantage and a reader
    /// concludes something about Tuesdays.
    /// </remarks>
    internal static IReadOnlyList<DayOfWeekDto> ByDayOfWeek(IReadOnlyList<ContributionDayDto> calendar)
    {
        if (calendar.Count == 0)
        {
            return [];
        }

        // Monday first: a working week that starts on Sunday reads as a weekend split in two.
        var order = new[]
        {
            DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday,
            DayOfWeek.Friday, DayOfWeek.Saturday, DayOfWeek.Sunday,
        };

        var grouped = calendar
            .GroupBy(day => day.Date.DayOfWeek)
            .ToDictionary(group => group.Key, group => (Total: group.Sum(d => d.Count), Days: group.Count()));

        return [.. order.Select(day =>
        {
            var found = grouped.GetValueOrDefault(day);
            return new DayOfWeekDto(
                day.ToString(),
                found.Total,
                found.Days == 0 ? 0 : (double)found.Total / found.Days);
        })];
    }

    /// <summary>
    /// The longest run of consecutive days with no contribution at all.
    /// </summary>
    /// <remarks>
    /// The counterweight to the streak. A page that shows only the best run is a page
    /// selecting its own evidence, and the gap is the figure that makes the streak mean
    /// something.
    /// </remarks>
    internal static int LongestGap(IReadOnlyList<ContributionDayDto> calendar)
    {
        var longest = 0;
        var run = 0;
        DateOnly? previous = null;

        foreach (var day in calendar)
        {
            if (day.Count > 0)
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
