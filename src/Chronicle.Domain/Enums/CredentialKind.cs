namespace Chronicle.Domain.Enums;

/// <summary>
/// What sort of credential a <see cref="Entities.Certification"/> row is.
/// </summary>
/// <remarks>
/// <para>
/// One entity rather than four. Certifications, Applied Skills, badges and completed
/// training are the same shape — a name, an issuer, a date and a link — differing only in
/// what they are worth. Four entities would mean four admin screens, four endpoints, four
/// seeders and four résumé sections that drift apart.
/// </para>
/// <para>
/// <b>The distinction is not cosmetic.</b> A certification is an exam somebody invigilated;
/// a training badge is a module clicked through. Rendering them at equal weight overstates
/// the second, so the kind decides prominence — and only the top two ever reach the CV.
/// </para>
/// <para>
/// <see cref="Certification"/> is zero so every row that existed before this enum keeps
/// exactly the meaning it had.
/// </para>
/// </remarks>
public enum CredentialKind
{
    /// <summary>An invigilated exam. AZ-900, CKAD. Full weight, and on the résumé.</summary>
    Certification = 0,

    /// <summary>A scenario-assessed credential, e.g. Microsoft Applied Skills. On the résumé.</summary>
    AppliedSkill = 1,

    /// <summary>A skill or achievement badge. Shown grouped and compact; not on the résumé.</summary>
    Badge = 2,

    /// <summary>A completed course, module or learning path. Compact; not on the résumé.</summary>
    Training = 3
}
