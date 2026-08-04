using Chronicle.Domain.Enums;

namespace Chronicle.Application.Features.Certifications;

/// <summary>A credential, shown on About, the Knowledge page and the résumé.</summary>
/// <remarks>
/// <see cref="Kind"/> and <see cref="ExpiryDate"/> were on the entity and in the database
/// before they were on this DTO, which meant About and the résumé could not see either. The
/// consequence was not cosmetic: a lapsed credential rendered as current on both, and on a
/// CV that is a false claim made silently. Every surface reads the same shape now.
/// </remarks>
public sealed record CertificationDto(
    string Name,
    string Issuer,
    CredentialKind Kind,
    DateOnly IssueDate,
    /// <summary>Null for credentials that do not lapse.</summary>
    DateOnly? ExpiryDate,
    /// <summary>
    /// Whether <see cref="ExpiryDate"/> has passed, decided here rather than by each caller.
    /// </summary>
    /// <remarks>
    /// The server owns its clock; the Next.js client is a Server Component under Cache
    /// Components and <b>may not read one at all</b>. Three pages each doing their own date
    /// arithmetic against a date they had to be handed is three chances to disagree about
    /// whether a credential is current.
    /// </remarks>
    bool IsExpired,
    /// <summary>Link out to the verifiable credential, when there is one.</summary>
    string? CredentialUrl,
    string? LogoUrl);
