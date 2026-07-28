using Chronicle.Domain.Common;
using Chronicle.Domain.Enums;

namespace Chronicle.Domain.Entities;

/// <summary>A topic currently being studied, shown on the Knowledge Core learning board.</summary>
public class LearningItem : AuditableEntity
{
    public string Topic { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;

    public LearningStatus Status { get; set; } = LearningStatus.Exploring;

    /// <summary>0-100. Null renders the card without a progress meter.</summary>
    public int? ProgressPercent { get; set; }

    public string? Link { get; set; }
    public int SortOrder { get; set; }
}
