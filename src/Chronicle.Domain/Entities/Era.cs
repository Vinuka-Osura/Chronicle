using Chronicle.Domain.Common;

namespace Chronicle.Domain.Entities;

/// <summary>
/// A named chapter of the timeline — "First Steps", "Banking Systems".
/// </summary>
/// <remarks>
/// Editorial by nature, which is why it is stored rather than derived from dates. Only a
/// person can decide where one chapter of a career ends and the next begins; a rule that
/// inferred it from job changes would miss the year someone spent quietly getting good
/// at something.
/// <para>
/// Eras are what turn the timeline from a list of dates into something a reader
/// remembers as a story.
/// </para>
/// </remarks>
public class Era : AuditableEntity
{
    public string Name { get; set; } = string.Empty;

    /// <summary>One line on what this chapter was about.</summary>
    public string? Tagline { get; set; }

    public DateOnly StartDate { get; set; }

    /// <summary>Null means the era is still running, or is the open-ended future one.</summary>
    public DateOnly? EndDate { get; set; }

    public int SortOrder { get; set; }
}
