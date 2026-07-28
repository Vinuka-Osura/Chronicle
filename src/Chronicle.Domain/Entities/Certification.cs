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
}
