using Chronicle.Domain.Common;
using Chronicle.Domain.Enums;

namespace Chronicle.Domain.Entities;

/// <summary>
/// A stated future goal. Rendered below the Timeline's "today" marker in dotted,
/// translucent styling so it is unmistakably a plan rather than a claim.
/// </summary>
public class RoadmapItem : AuditableEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    public DateOnly TargetDate { get; set; }
    public RoadmapStatus Status { get; set; } = RoadmapStatus.Planned;

    public int SortOrder { get; set; }
}
