namespace Chronicle.Domain.ValueObjects;

/// <summary>
/// Open-ended facts about a stored image, serialised into <c>portfolio_media.Metadata</c>
/// as <c>jsonb</c>.
/// </summary>
/// <remarks>
/// <para>
/// A value object, not an entity: it has no identity of its own and no life apart from
/// the <c>Media</c> row that owns it. It lives outside <c>Chronicle.Domain.Entities</c>
/// for exactly that reason — the architecture test asserts that everything in that
/// namespace derives from <c>Entity</c>, and it was right to reject this.
/// </para>
/// <para>
/// A column each would mean a migration per idea and a table of mostly-null columns.
/// Width and height are what we want today; a dominant colour or a blurhash is the sort
/// of thing added later. See <c>docs/technical-decisions.md</c> §2.
/// </para>
/// </remarks>
public class MediaMetadata
{
    public int? Width { get; set; }
    public int? Height { get; set; }

    /// <summary>What the operator called it. Recorded, but never used to build a path.</summary>
    public string? OriginalFileName { get; set; }
}
