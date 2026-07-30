using Chronicle.Domain.Common;
using Chronicle.Domain.Enums;

namespace Chronicle.Domain.Entities;

/// <summary>
/// A life event — graduating, a talk given, a community contribution.
/// </summary>
/// <remarks>
/// The life half of the timeline's two tracks. It exists as its own entity because
/// nothing else carries a life event: bending <see cref="Experience"/> to hold
/// "graduated" would corrupt both the résumé and the skills join, which are built on the
/// assumption that an Experience is a job.
/// <para>
/// It also feeds the education and fundamentals layer the Software City concept
/// describes, so the career-graph contract has real data behind it later.
/// </para>
/// </remarks>
public class Milestone : AuditableEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    public DateOnly Date { get; set; }

    /// <summary>Null for a point in time rather than a span.</summary>
    public DateOnly? EndDate { get; set; }

    public MilestoneCategory Category { get; set; } = MilestoneCategory.Personal;

    public string? Link { get; set; }

    public int SortOrder { get; set; }
}
