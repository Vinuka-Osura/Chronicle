using Chronicle.Domain.Common;
using Chronicle.Domain.ValueObjects;

namespace Chronicle.Domain.Entities;

/// <summary>
/// A project screenshot or diagram. The bytes live in object storage; this row records
/// where they are and what they are.
/// </summary>
public class Media : AuditableEntity
{
    public Guid ProjectId { get; set; }
    public Project? Project { get; set; }

    /// <summary>The object's key in storage, generated server-side.</summary>
    /// <remarks>
    /// Kept alongside <see cref="Url"/> rather than sliced back out of it, because the
    /// two legitimately diverge: the public URL may be a CDN or a custom domain that
    /// knows nothing about the bucket's internal layout. Deriving the key from the URL
    /// works right up until that domain changes, at which point deletes silently stop
    /// working while still appearing to succeed.
    /// </remarks>
    public string StorageKey { get; set; } = string.Empty;

    /// <summary>Where a browser fetches it from.</summary>
    public string Url { get; set; } = string.Empty;

    public string? Caption { get; set; }

    public string ContentType { get; set; } = string.Empty;

    /// <summary>
    /// Recorded on upload so the admin storage gauge can sum a column rather than list
    /// the bucket — which is a billable operation, and a slow one, to answer a question
    /// the database already knows the answer to.
    /// </summary>
    public long SizeBytes { get; set; }

    /// <summary>
    /// Open-ended facts about the image, stored as <c>jsonb</c>: pixel dimensions, the
    /// original filename, and whatever a later feature wants without a migration.
    /// </summary>
    /// <remarks>
    /// A column each would mean a migration per idea and a table of mostly-null columns.
    /// See <c>docs/technical-decisions.md</c> §2.
    /// </remarks>
    public MediaMetadata Metadata { get; set; } = new();

    public int SortOrder { get; set; }
}
