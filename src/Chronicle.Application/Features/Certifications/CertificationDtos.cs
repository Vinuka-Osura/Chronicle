namespace Chronicle.Application.Features.Certifications;

/// <summary>A credential, shown in the About page's certifications strip.</summary>
public sealed record CertificationDto(
    string Name,
    string Issuer,
    DateOnly IssueDate,
    /// <summary>Link out to the verifiable credential, when there is one.</summary>
    string? CredentialUrl,
    string? LogoUrl);
