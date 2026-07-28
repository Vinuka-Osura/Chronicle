using Chronicle.Domain.Common;

namespace Chronicle.Domain.Entities;

/// <summary>
/// A piece of work, rendered as a case study built from the eight-part template.
/// Flagship projects fill every section; smaller ones leave the optional Markdown
/// fields null and render as a concise card.
/// </summary>
public class Project : AuditableEntity
{
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;

    /// <summary>One-line pitch shown on cards and in the Timeline node.</summary>
    public string Pitch { get; set; } = string.Empty;

    // --- Case-study body. Markdown, stored raw and sanitised at render time. ---
    public string Problem { get; set; } = string.Empty;
    public string Solution { get; set; } = string.Empty;
    public string? KeyDecisions { get; set; }
    public string? ArchitectureNotes { get; set; }
    public string? ArchitectureDiagramUrl { get; set; }
    public string? Results { get; set; }
    public string? LessonsLearned { get; set; }

    // --- Artifacts ---
    public string? VideoUrl { get; set; }
    public string? GithubUrl { get; set; }
    public string? DemoUrl { get; set; }
    public string? DocsUrl { get; set; }

    public DateOnly StartDate { get; set; }

    /// <summary>Null means ongoing.</summary>
    public DateOnly? EndDate { get; set; }

    public bool Featured { get; set; }
    public int SortOrder { get; set; }

    public ICollection<Media> Screenshots { get; set; } = new List<Media>();
    public ICollection<Tag> Tags { get; set; } = new List<Tag>();
    public ICollection<Skill> TechStack { get; set; } = new List<Skill>();
}
