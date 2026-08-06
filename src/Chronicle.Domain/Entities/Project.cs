using Chronicle.Domain.Common;
using Chronicle.Domain.ValueObjects;

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

    /// <summary>
    /// The architecture, described one edge per line: <c>Browser -&gt; API : HTTPS</c>.
    /// </summary>
    /// <remarks>
    /// Rendered as an animated SVG rather than stored as a picture. A description can be
    /// themed, searched, read aloud and kept in step with the system; an uploaded PNG can
    /// do none of those and goes stale the moment the architecture changes.
    /// <see cref="ArchitectureDiagramUrl"/> remains for diagrams this cannot express.
    /// </remarks>
    public string? ArchitectureDiagram { get; set; }

    /// <summary>
    /// Headline numbers from the results, rendered as tiles rather than buried in prose.
    /// </summary>
    /// <remarks>
    /// jsonb. Every project's numbers are different, so a column per metric would be a
    /// migration per project - see docs/technical-decisions.md section 2.
    /// </remarks>
    public List<ProjectMetric> Metrics { get; set; } = [];
    public string? Results { get; set; }
    public string? LessonsLearned { get; set; }

    // --- Artifacts ---
    public string? VideoUrl { get; set; }
    public string? GithubUrl { get; set; }
    public string? DemoUrl { get; set; }
    public string? DocsUrl { get; set; }

    // --- Whose work this is ---

    /// <summary>
    /// The organisation that owns the work, when it is not the author's own.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Null means a personal project — the common case, and the reason this is nullable
    /// rather than defaulted to a name. A project with an owner is work done for somebody
    /// else, shown here because they agreed it could be, and the site groups those under
    /// the owner's name rather than mixing them in with work the author is free to
    /// publish.
    /// </para>
    /// <para>
    /// Naming a real company on a public page is a claim about that company, so this is
    /// deliberately paired with <see cref="PermissionNote"/>: the name alone asserts a
    /// relationship, and the note is what says the relationship was agreed.
    /// </para>
    /// </remarks>
    public string? Owner { get; set; }

    /// <summary>The owner's own site, so the claim is checkable.</summary>
    public string? OwnerUrl { get; set; }

    /// <summary>
    /// How permission to publish was given, in the author's words. Rendered verbatim
    /// beside the owner's name.
    /// </summary>
    /// <remarks>
    /// A sentence, not a flag. "Approved for portfolio use by X" is something a reader can
    /// weigh; a boolean rendered as a tick is a claim with no author behind it.
    /// </remarks>
    public string? PermissionNote { get; set; }

    /// <summary>
    /// Optional evidence of involvement — a reference, a public write-up, a release note.
    /// </summary>
    public string? EvidenceUrl { get; set; }

    public DateOnly StartDate { get; set; }

    /// <summary>Null means ongoing.</summary>
    public DateOnly? EndDate { get; set; }

    public bool Featured { get; set; }
    public int SortOrder { get; set; }

    public ICollection<Media> Screenshots { get; set; } = new List<Media>();
    public ICollection<Tag> Tags { get; set; } = new List<Tag>();
    public ICollection<Skill> TechStack { get; set; } = new List<Skill>();
}
