using Chronicle.Domain.ValueObjects;

namespace Chronicle.Application.Common.Content;

/// <summary>
/// Turns the operator's plain-text metrics into structured ones.
/// </summary>
/// <remarks>
/// <para>
/// One per line, pipe-separated:
/// </para>
/// <code>
/// Statement p95 | 2.4s to 40ms | at the 95th percentile
/// Balance discrepancies | 0 | in 18 months since cutover
/// Posting throughput | ~4,000/sec
/// </code>
/// <para>
/// Pipes rather than a colon or an equals sign, because the values themselves are full
/// of both — "p99: 40ms" and "2.4s = 40ms" are things a person would reasonably type,
/// and a separator that appears inside the data is a parser that fights its user.
/// </para>
/// <para>
/// Parsed on the server rather than in the admin form, so the rule is one testable thing
/// rather than something the UI and the API each have their own opinion about.
/// </para>
/// </remarks>
public static class MetricParsing
{
    /// <summary>
    /// Four fits a row on a phone and is about as many numbers as anyone reads before
    /// they stop counting. More than this is a table, and a table belongs in the prose.
    /// </summary>
    public const int MaxMetrics = 4;

    public static List<ProjectMetric> Parse(string? source)
    {
        if (string.IsNullOrWhiteSpace(source))
        {
            return [];
        }

        var metrics = new List<ProjectMetric>();

        foreach (var raw in source.Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries))
        {
            var line = raw.Trim();
            if (line.Length == 0 || line.StartsWith('#'))
            {
                continue;
            }

            var parts = line.Split('|', StringSplitOptions.TrimEntries);

            // A line with no value is not a metric, it is a heading someone typed by
            // mistake. Skipped rather than rejected: losing one line beats failing a save
            // and making the operator find which of eight lines was wrong.
            if (parts.Length < 2 || parts[0].Length == 0 || parts[1].Length == 0)
            {
                continue;
            }

            metrics.Add(new ProjectMetric
            {
                Label = parts[0],
                Value = parts[1],
                Note = parts.Length > 2 && parts[2].Length > 0 ? parts[2] : null
            });

            if (metrics.Count == MaxMetrics)
            {
                break;
            }
        }

        return metrics;
    }

    /// <summary>The inverse, for putting existing metrics back into the editor.</summary>
    public static string Format(IEnumerable<ProjectMetric> metrics) =>
        string.Join(
            Environment.NewLine,
            (metrics ?? []).Select(metric => metric.Note is { Length: > 0 } note
                ? $"{metric.Label} | {metric.Value} | {note}"
                : $"{metric.Label} | {metric.Value}"));
}
