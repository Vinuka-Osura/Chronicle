using Chronicle.Application.Features.Analytics;
using Chronicle.Application.Features.Analytics.Queries.GetGitHubStats;

namespace Chronicle.Application.Tests.Features.Analytics;

/// <summary>
/// The figures the Analytics page states as fact but GitHub does not return.
/// </summary>
/// <remarks>
/// Streaks are the kind of arithmetic that looks obviously right and is quietly wrong at
/// the edges - a day still in progress, a gap in the data, a run that ends at the last
/// day the calendar covers. A wrong streak on a portfolio is a claim about the owner
/// that nobody would ever notice was false.
/// </remarks>
public class GitHubStatsDerivationTests
{
    private static readonly DateOnly Today = new(2026, 7, 30);

    private static List<ContributionDayDto> Days(params (int DaysAgo, int Count)[] entries) =>
        [.. entries.Select(e => new ContributionDayDto(Today.AddDays(-e.DaysAgo), e.Count))
            .OrderBy(d => d.Date)];

    // -----------------------------------------------------------------------
    // Current streak
    // -----------------------------------------------------------------------

    [Fact]
    public void CurrentStreak_is_zero_for_an_empty_calendar()
    {
        GetGitHubStatsQueryHandler.CurrentStreak([], Today).ShouldBe(0);
    }

    [Fact]
    public void CurrentStreak_counts_back_from_today_when_today_has_contributions()
    {
        var calendar = Days((0, 3), (1, 1), (2, 5), (3, 0), (4, 9));

        GetGitHubStatsQueryHandler.CurrentStreak(calendar, Today).ShouldBe(3);
    }

    /// <summary>
    /// The case that makes a naive implementation wrong for most of every day: at 09:00
    /// today has no contributions yet, and a streak that resets every midnight is not a
    /// streak.
    /// </summary>
    [Fact]
    public void CurrentStreak_survives_a_today_that_has_not_started_yet()
    {
        var calendar = Days((0, 0), (1, 2), (2, 4), (3, 1), (4, 0));

        GetGitHubStatsQueryHandler.CurrentStreak(calendar, Today).ShouldBe(3);
    }

    [Fact]
    public void CurrentStreak_is_zero_when_neither_today_nor_yesterday_contributed()
    {
        var calendar = Days((0, 0), (1, 0), (2, 7), (3, 7));

        GetGitHubStatsQueryHandler.CurrentStreak(calendar, Today).ShouldBe(0);
    }

    /// <summary>
    /// A missing row is not a zero row. Walking positions rather than dates would join
    /// the two sides of the gap and overstate the streak.
    /// </summary>
    [Fact]
    public void CurrentStreak_stops_at_a_missing_day_rather_than_stepping_over_it()
    {
        var calendar = Days((0, 1), (1, 1), (3, 1), (4, 1));

        GetGitHubStatsQueryHandler.CurrentStreak(calendar, Today).ShouldBe(2);
    }

    // -----------------------------------------------------------------------
    // Longest streak
    // -----------------------------------------------------------------------

    [Fact]
    public void LongestStreak_is_zero_for_an_empty_calendar()
    {
        GetGitHubStatsQueryHandler.LongestStreak([]).ShouldBe(0);
    }

    [Fact]
    public void LongestStreak_is_zero_when_nothing_was_contributed()
    {
        GetGitHubStatsQueryHandler.LongestStreak(Days((0, 0), (1, 0), (2, 0))).ShouldBe(0);
    }

    [Fact]
    public void LongestStreak_finds_the_best_run_not_the_most_recent()
    {
        // Four in a row a while back; two in a row just now.
        var calendar = Days(
            (0, 1), (1, 1), (2, 0),
            (3, 2), (4, 2), (5, 2), (6, 2), (7, 0));

        GetGitHubStatsQueryHandler.LongestStreak(calendar).ShouldBe(4);
    }

    [Fact]
    public void LongestStreak_counts_a_run_that_reaches_the_end_of_the_calendar()
    {
        var calendar = Days((0, 1), (1, 1), (2, 1), (3, 0));

        GetGitHubStatsQueryHandler.LongestStreak(calendar).ShouldBe(3);
    }

    [Fact]
    public void LongestStreak_does_not_bridge_a_missing_day()
    {
        // Two either side of a day with no row at all. Position-based logic returns 4.
        var calendar = Days((0, 1), (1, 1), (3, 1), (4, 1));

        GetGitHubStatsQueryHandler.LongestStreak(calendar).ShouldBe(2);
    }

    // -----------------------------------------------------------------------
    // Longest gap - the streak's counterweight
    // -----------------------------------------------------------------------

    [Fact]
    public void LongestGap_is_zero_when_every_day_has_something()
    {
        var calendar = Days((0, 1), (1, 2), (2, 1));

        GetGitHubStatsQueryHandler.LongestGap(calendar).ShouldBe(0);
    }

    [Fact]
    public void LongestGap_finds_the_longest_run_of_empty_days()
    {
        // Four days ago through two days ago is three empty days.
        var calendar = Days((0, 1), (1, 0), (2, 0), (3, 0), (4, 0), (5, 3), (6, 0));

        GetGitHubStatsQueryHandler.LongestGap(calendar).ShouldBe(4);
    }

    [Fact]
    public void LongestGap_does_not_bridge_a_missing_day()
    {
        // Empty days either side of a date with no row at all. The gap is two runs of
        // one, not a run of two - the same rule the streak walk follows.
        var calendar = Days((0, 0), (2, 0), (4, 1));

        GetGitHubStatsQueryHandler.LongestGap(calendar).ShouldBe(1);
    }

    // -----------------------------------------------------------------------
    // Weekly buckets, which back the work-over-time chart
    // -----------------------------------------------------------------------

    [Fact]
    public void Weekly_buckets_run_Monday_to_Sunday()
    {
        // 2026-07-27 is a Monday; 2026-08-02 the Sunday that closes the same week.
        var calendar = new List<ContributionDayDto>
        {
            new(new DateOnly(2026, 7, 27), 1),
            new(new DateOnly(2026, 8, 2), 2),
            new(new DateOnly(2026, 8, 3), 4),
        };

        var weeks = GetGitHubStatsQueryHandler.Weekly(calendar);

        weeks.Count.ShouldBe(2);
        weeks[0].WeekStart.ShouldBe(new DateOnly(2026, 7, 27));
        weeks[0].Total.ShouldBe(3);
        weeks[1].WeekStart.ShouldBe(new DateOnly(2026, 8, 3));
        weeks[1].Total.ShouldBe(4);
    }

    /// <summary>
    /// A mean over a window that is not yet full is the first week wearing a disguise,
    /// so it is absent rather than misleading.
    /// </summary>
    [Fact]
    public void Weekly_withholds_the_mean_until_the_window_is_full()
    {
        var calendar = Enumerable.Range(0, 35)
            .Select(offset => new ContributionDayDto(new DateOnly(2026, 6, 1).AddDays(offset), 7))
            .ToList();

        var weeks = GetGitHubStatsQueryHandler.Weekly(calendar);

        weeks[0].Mean.ShouldBeNull();
        weeks[1].Mean.ShouldBeNull();
        weeks[2].Mean.ShouldBeNull();
        weeks[3].Mean.ShouldNotBeNull();
    }

    [Fact]
    public void Weekly_averages_the_four_weeks_ending_at_each_point()
    {
        // Four whole weeks from a Monday, at 7, 14, 21 and 28 contributions.
        var monday = new DateOnly(2026, 6, 1);
        var calendar = Enumerable.Range(0, 28)
            .Select(offset => new ContributionDayDto(monday.AddDays(offset), (offset / 7) + 1))
            .ToList();

        var weeks = GetGitHubStatsQueryHandler.Weekly(calendar);

        weeks.Count.ShouldBe(4);
        weeks.Select(w => w.Total).ShouldBe([7, 14, 21, 28]);
        weeks[3].Mean!.Value.ShouldBe(17.5, 0.001);
    }

    [Fact]
    public void Weekly_is_empty_for_an_empty_calendar() =>
        GetGitHubStatsQueryHandler.Weekly([]).ShouldBeEmpty();

    // -----------------------------------------------------------------------
    // Weekday profile
    // -----------------------------------------------------------------------

    [Fact]
    public void ByDayOfWeek_starts_on_Monday()
    {
        var calendar = Days((0, 1));

        GetGitHubStatsQueryHandler.ByDayOfWeek(calendar)
            .Select(d => d.Day)
            .ShouldBe(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]);
    }

    /// <summary>
    /// The reason the chart shows the mean and not the total: a 365-day window holds more
    /// of one weekday than the others, so totals hand that day a head start a reader
    /// mistakes for a preference.
    /// </summary>
    [Fact]
    public void ByDayOfWeek_means_are_per_occurrence_not_per_total()
    {
        // Three Mondays at 2 each, one Tuesday at 6. Equal totals, different means.
        var monday = new DateOnly(2026, 6, 1);
        var calendar = new List<ContributionDayDto>
        {
            new(monday, 2),
            new(monday.AddDays(7), 2),
            new(monday.AddDays(14), 2),
            new(monday.AddDays(1), 6),
        };

        var byDay = GetGitHubStatsQueryHandler.ByDayOfWeek(calendar);

        var mondays = byDay.Single(d => d.Day == "Monday");
        var tuesdays = byDay.Single(d => d.Day == "Tuesday");

        mondays.Total.ShouldBe(tuesdays.Total);
        mondays.Mean.ShouldBe(2, 0.001);
        tuesdays.Mean.ShouldBe(6, 0.001);
    }

    [Fact]
    public void ByDayOfWeek_is_empty_for_an_empty_calendar() =>
        GetGitHubStatsQueryHandler.ByDayOfWeek([]).ShouldBeEmpty();
}
