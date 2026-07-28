using Chronicle.Domain.Common;

namespace Chronicle.Domain.Entities;

/// <summary>A label shared by projects and posts, used for filtering.</summary>
public class Tag : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;

    /// <summary>Optional grouping, e.g. "topic" or "technology".</summary>
    public string? Category { get; set; }

    public ICollection<Project> Projects { get; set; } = new List<Project>();
    public ICollection<Post> Posts { get; set; } = new List<Post>();
}
