namespace Chronicle.Domain.Common;

/// <summary>
/// Base for content entities that the admin CMS creates and edits.
/// </summary>
/// <remarks>
/// Every content entity carries both timestamps, even where the spec's per-entity
/// table lists only one. Uniformity costs two columns and removes a whole class of
/// "which entities can I sort by recency?" questions.
/// </remarks>
public abstract class AuditableEntity : Entity, IAuditable
{
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
