using Chronicle.Domain.Common;

namespace Chronicle.Domain.Entities;

/// <summary>
/// A project screenshot. Only the URL is persisted; the bytes live in object storage.
/// </summary>
public class Media : AuditableEntity
{
    public Guid ProjectId { get; set; }
    public Project? Project { get; set; }

    public string Url { get; set; } = string.Empty;
    public string? Caption { get; set; }
    public int SortOrder { get; set; }
}
