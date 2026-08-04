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

    // ── Handles on other platforms ──────────────────────────────────────────────
    //
    // These are what the Analytics page fetches from, and they live here rather than in
    // configuration for two reasons. They are public identifiers, not secrets, so nothing
    // is gained by hiding them; and a username in appsettings.json cannot be changed
    // without a redeploy, which contradicts the rule that everything on the public site is
    // editable in the CMS.
    //
    // The GitHub *token* stays in configuration. It is a secret, and a secret in a
    // database travels with every backup, dump and restored test copy of it.
    //
    // A null or blank handle means the provider makes no network call at all and its
    // section does not render. There is deliberately no fallback to configuration: a stale
    // config value could otherwise resurrect a handle that was deliberately cleared.

    /// <summary>GitHub login, e.g. <c>Vinuka-Osura</c>. Not the profile URL.</summary>
    public string? GitHubUsername { get; set; }

    /// <summary>The numeric id from a Stack Overflow profile URL, e.g. <c>23785133</c>.</summary>
    public string? StackOverflowUserId { get; set; }

    /// <summary>Credly username. The profile must be public for the badge feed to answer.</summary>
    public string? CredlyUsername { get; set; }

    public string? DockerHubUsername { get; set; }

    /// <summary>Medium username, stored without the leading <c>@</c>.</summary>
    public string? MediumUsername { get; set; }
}
