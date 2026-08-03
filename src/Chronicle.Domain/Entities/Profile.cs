using Chronicle.Domain.Common;

namespace Chronicle.Domain.Entities;

/// <summary>
/// Who the site is about: the name, the contact details and the professional summary.
/// </summary>
/// <remarks>
/// <para>
/// This exists because of the résumé. Every other section of the CV — roles, skills,
/// education, certifications — was already a row somewhere, but the header and the
/// summary were typed into the page component, which meant the one part of the CV a
/// recruiter reads first was the one part the CMS could not change.
/// </para>
/// <para>
/// The fields are chosen for what an applicant-tracking system parses rather than for
/// what looks good in a header. <see cref="Headline"/> is separate from
/// <see cref="Summary"/> because a parser reads it as the target job title, and
/// <see cref="Location"/> is its own column rather than part of a contact blob because
/// filters are built on it.
/// </para>
/// <para>
/// Single-row table. <see cref="SingletonId"/> is fixed, so the admin screen only ever
/// edits — there cannot be two people.
/// </para>
/// </remarks>
public class Profile : AuditableEntity
{
    /// <summary>Fixed primary key for the one and only row.</summary>
    public static readonly Guid SingletonId = new("0195c0de-0000-7000-8000-000000000002");

    /// <summary>The name at the top of the CV, spelled the way it should be filed.</summary>
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// The role being applied for, not a slogan. Parsers treat the line under the name as
    /// the candidate's title, so "Software Engineer" belongs here and "building things
    /// that matter" does not.
    /// </summary>
    public string Headline { get; set; } = string.Empty;

    /// <summary>
    /// Two to four sentences of professional summary, in prose.
    /// </summary>
    /// <remarks>
    /// Deliberately not a list of adjectives. This is the block a human skims and a
    /// keyword matcher reads, so it wants the actual domain nouns of the work.
    /// </remarks>
    public string Summary { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string? Phone { get; set; }

    /// <summary>City and country. Enough to answer "can they work here?", no more.</summary>
    public string? Location { get; set; }

    public string? LinkedInUrl { get; set; }

    public string? GitHubUrl { get; set; }

    public string? WebsiteUrl { get; set; }

    /// <summary>
    /// Optional closing section of the CV — availability, work authorisation, a note about
    /// relocation. Rendered only when set, because an empty heading reads as an omission.
    /// </summary>
    public string? Availability { get; set; }
}
