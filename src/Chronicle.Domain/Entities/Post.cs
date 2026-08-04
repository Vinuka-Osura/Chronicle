using Chronicle.Domain.Common;

namespace Chronicle.Domain.Entities;

/// <summary>A Knowledge Core article.</summary>
public class Post : AuditableEntity
{
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Excerpt { get; set; } = string.Empty;
    public string BodyMarkdown { get; set; } = string.Empty;

    /// <summary>Derived from <see cref="BodyMarkdown"/> word count when the post is saved.</summary>
    public int ReadingTimeMinutes { get; set; }

    public bool IsPublished { get; set; }
    public DateTimeOffset? PublishedAt { get; set; }

    /// <summary>
    /// Where the article actually lives, when it was published somewhere else.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Set, and this row is a <b>pointer</b> rather than an article: the Knowledge page shows
    /// a preview card that links out, <see cref="BodyMarkdown"/> is unused, and there is
    /// nothing to read at <c>/knowledge/{slug}</c>. Null, and it behaves exactly as it always
    /// has — a full article hosted here.
    /// </para>
    /// <para>
    /// This exists because Medium has an RSS feed and LinkedIn has neither a feed nor a
    /// public article API, so anything published there can only be entered by hand. The same
    /// row works for any publisher, including ones nobody has heard of.
    /// </para>
    /// </remarks>
    public string? ExternalUrl { get; set; }

    /// <summary>
    /// The article's own picture, for a preview card.
    /// </summary>
    /// <remarks>
    /// Only meaningful alongside <see cref="ExternalUrl"/>. A card that links away from the
    /// site has to earn the click, and a title on its own does not.
    /// </remarks>
    public string? CoverImageUrl { get; set; }

    public ICollection<Tag> Tags { get; set; } = new List<Tag>();
}
