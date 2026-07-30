namespace Chronicle.Domain.ValueObjects;

/// <summary>
/// One headline number from a project's results, stored in <c>jsonb</c>.
/// </summary>
/// <remarks>
/// <para>
/// A value object, not an entity: it has no identity and no life apart from the project
/// that owns it. It lives outside <c>Chronicle.Domain.Entities</c> for that reason — the
/// architecture test asserts everything in that namespace derives from <c>Entity</c>.
/// </para>
/// <para>
/// Structured rather than left inside the Results prose, because a number is the thing a
/// reader is scanning for and burying it in a paragraph makes them hunt. Every project's
/// numbers are different, which is exactly what <c>jsonb</c> is for: a column per metric
/// would be a migration per project.
/// </para>
/// </remarks>
public class ProjectMetric
{
    /// <summary>What was measured. "Statement p95", not "Performance".</summary>
    public string Label { get; set; } = string.Empty;

    /// <summary>
    /// The number, as written. A string rather than a decimal on purpose: "2.4s to 40ms"
    /// and "~4,000/sec" are the honest answers, and forcing them into a numeric type
    /// would mean inventing units and losing the arrow.
    /// </summary>
    public string Value { get; set; } = string.Empty;

    /// <summary>The caveat that stops the number being a lie. Optional, and usually the honest part.</summary>
    public string? Note { get; set; }
}
