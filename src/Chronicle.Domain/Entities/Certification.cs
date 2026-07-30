using Chronicle.Domain.Common;

namespace Chronicle.Domain.Entities;

/// <summary>A credential, shown in the About page's certifications strip.</summary>
public class Certification : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;

    public DateOnly IssueDate { get; set; }

    /// <summary>Link out to the verifiable credential.</summary>
    public string? CredentialUrl { get; set; }

    public string? LogoUrl { get; set; }
    public int SortOrder { get; set; }

    /// <summary>
    /// What this credential attests to. Without it a certification is a dead end on the
    /// timeline; with it the chain runs
    /// <c>AZ-204 → certifies Azure → used in Chronicle</c> off real data rather than
    /// hand-authored links.
    /// </summary>
    public ICollection<Skill> Skills { get; set; } = new List<Skill>();
}
