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
}
