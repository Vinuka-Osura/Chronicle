using Chronicle.Domain.Common;

namespace Chronicle.Domain.Entities;

/// <summary>A role held. Anchored on the Timeline axis and listed on the résumé.</summary>
public class Experience : AuditableEntity
{
    public string Role { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;

    public DateOnly StartDate { get; set; }

    /// <summary>Null means current.</summary>
    public DateOnly? EndDate { get; set; }

    /// <summary>Markdown.</summary>
    public string Summary { get; set; } = string.Empty;

    /// <summary>
    /// Bullet points revealed when the Timeline node expands. Mapped by EF Core as a
    /// primitive collection, which the Npgsql provider stores as a single jsonb column.
    /// </summary>
    public List<string> Highlights { get; set; } = [];

    public int SortOrder { get; set; }

    public ICollection<Skill> TechStack { get; set; } = new List<Skill>();
}
