namespace Chronicle.Application.Features.Profile;

/// <summary>
/// The CV header: who this is, how to reach them, and the summary paragraph.
/// </summary>
/// <remarks>
/// Every link is nullable because a CV that prints an empty "LinkedIn:" label looks
/// worse than one that omits the line. The renderer drops what is not set.
/// </remarks>
public sealed record ProfileDto(
    string FullName,
    string Headline,
    string Summary,
    string Email,
    string? Phone,
    string? Location,
    string? LinkedInUrl,
    string? GitHubUrl,
    string? WebsiteUrl,
    string? Availability);
