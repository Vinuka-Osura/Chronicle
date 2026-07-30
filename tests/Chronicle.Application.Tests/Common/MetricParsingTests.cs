using Chronicle.Application.Common.Content;
using Chronicle.Domain.ValueObjects;

namespace Chronicle.Application.Tests.Common;

/// <summary>
/// The metric mini-format.
/// </summary>
/// <remarks>
/// A parser fed by hand-typed text, so the cases that matter are the malformed ones. The
/// rule throughout is that a bad line is skipped rather than thrown on: losing one metric
/// beats failing a save and making the operator work out which of eight lines was wrong.
/// </remarks>
public class MetricParsingTests
{
    [Fact]
    public void Parses_label_and_value()
    {
        var metrics = MetricParsing.Parse("Statement p95 | 2.4s to 40ms");

        var metric = metrics.ShouldHaveSingleItem();
        metric.Label.ShouldBe("Statement p95");
        metric.Value.ShouldBe("2.4s to 40ms");
        metric.Note.ShouldBeNull();
    }

    [Fact]
    public void Parses_the_optional_note()
    {
        var metric = MetricParsing.Parse("Discrepancies | 0 | in 18 months").ShouldHaveSingleItem();

        metric.Note.ShouldBe("in 18 months");
    }

    /// <summary>
    /// Why the separator is a pipe. Both of these are things a person would reasonably
    /// type, and a separator that appears inside the data is a parser fighting its user.
    /// </summary>
    [Theory]
    [InlineData("Latency | p99: 40ms", "p99: 40ms")]
    [InlineData("Throughput | 4,000/sec = steady", "4,000/sec = steady")]
    public void Leaves_colons_and_equals_signs_inside_the_value(string line, string expected)
    {
        MetricParsing.Parse(line).ShouldHaveSingleItem().Value.ShouldBe(expected);
    }

    [Fact]
    public void Trims_surrounding_whitespace()
    {
        var metric = MetricParsing.Parse("   Uptime   |   99.95%   ").ShouldHaveSingleItem();

        metric.Label.ShouldBe("Uptime");
        metric.Value.ShouldBe("99.95%");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("\n\n")]
    public void Returns_nothing_for_nothing(string? source)
    {
        MetricParsing.Parse(source).ShouldBeEmpty();
    }

    [Fact]
    public void Skips_a_line_with_no_value_rather_than_throwing()
    {
        // Someone typing a heading out of habit. It is not a metric; it is also not an
        // error worth failing a save over.
        var metrics = MetricParsing.Parse("Results\nUptime | 99.95%");

        metrics.ShouldHaveSingleItem().Label.ShouldBe("Uptime");
    }

    [Fact]
    public void Skips_a_line_whose_value_is_blank()
    {
        MetricParsing.Parse("Uptime |   ").ShouldBeEmpty();
    }

    [Fact]
    public void Ignores_comments_and_blank_lines()
    {
        var metrics = MetricParsing.Parse("# the ones worth showing\n\nUptime | 99.95%\n\n");

        metrics.ShouldHaveSingleItem();
    }

    /// <summary>
    /// Four fits a row on a phone. Past that it is a table, and a table belongs in prose —
    /// so the extras are dropped rather than rendered into a wall of tiles.
    /// </summary>
    [Fact]
    public void Caps_at_four()
    {
        var source = string.Join("\n", Enumerable.Range(1, 9).Select(n => $"Metric {n} | {n}"));

        var metrics = MetricParsing.Parse(source);

        metrics.Count.ShouldBe(MetricParsing.MaxMetrics);
        metrics[0].Label.ShouldBe("Metric 1");
        metrics[3].Label.ShouldBe("Metric 4");
    }

    [Fact]
    public void Handles_windows_and_unix_line_endings_alike()
    {
        MetricParsing.Parse("A | 1\r\nB | 2\rC | 3\nD | 4").Count.ShouldBe(4);
    }

    // -----------------------------------------------------------------------

    [Fact]
    public void Format_round_trips_through_Parse()
    {
        var original = new List<ProjectMetric>
        {
            new() { Label = "Statement p95", Value = "2.4s to 40ms", Note = "at the 95th" },
            new() { Label = "Discrepancies", Value = "0" }
        };

        var reparsed = MetricParsing.Parse(MetricParsing.Format(original));

        reparsed.Count.ShouldBe(2);
        reparsed[0].Note.ShouldBe("at the 95th");
        // The absent note must come back absent, not as an empty string — otherwise the
        // editor gains a trailing pipe every time the project is saved.
        reparsed[1].Note.ShouldBeNull();
    }

    [Fact]
    public void Format_of_nothing_is_an_empty_string()
    {
        MetricParsing.Format([]).ShouldBeEmpty();
    }
}
