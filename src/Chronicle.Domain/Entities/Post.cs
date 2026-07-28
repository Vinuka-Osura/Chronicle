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

    public ICollection<Tag> Tags { get; set; } = new List<Tag>();
}
