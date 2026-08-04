using Chronicle.Domain.Common;
using Chronicle.Domain.Enums;

namespace Chronicle.Domain.Entities;

/// <summary>A credential, shown in the About page's certifications strip.</summary>
public class Certification : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;

    /// <summary>
    /// Certification, Applied Skill, badge or training. Decides how much room it gets and
    /// whether it reaches the CV.
    /// </summary>
    public CredentialKind Kind { get; set; } = CredentialKind.Certification;

    public DateOnly IssueDate { get; set; }

    /// <summary>
    /// When it lapses, for the credentials that do.
    /// </summary>
    /// <remarks>
    /// Null means it does not expire — CKAD and most Linux Foundation credentials. Set for
    /// the ones that renew annually, which is most Microsoft certifications. Without this
    /// the site presents a lapsed credential as current, which is a false claim on a CV
    /// made silently, and the kind of thing nobody notices until a recruiter checks.
    /// </remarks>
    public DateOnly? ExpiryDate { get; set; }

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
