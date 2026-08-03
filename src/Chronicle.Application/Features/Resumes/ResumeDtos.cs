using Chronicle.Application.Features.Certifications;
using Chronicle.Application.Features.Experience;
using Chronicle.Application.Features.Profile;
using Chronicle.Application.Features.Projects;
using Chronicle.Application.Features.Skills;

namespace Chronicle.Application.Features.Resumes;

/// <summary>
/// The whole CV, in the order a reverse-chronological résumé is read.
/// </summary>
/// <remarks>
/// <para>
/// This is a projection, not a stored document. Nothing here is typed twice: every
/// section is the same rows the corresponding page renders, so the CV cannot drift from
/// the site the way a separately-maintained PDF always does.
/// </para>
/// <para>
/// It exists as one DTO rather than five client-side fetches because there are now two
/// renderers — the web page and the Word export — and two renderers assembling the same
/// document from five endpoints each is exactly how the export starts disagreeing with
/// the page.
/// </para>
/// </remarks>
public sealed record ResumeDto(
    ProfileDto? Profile,
    IReadOnlyList<ExperienceDto> Roles,
    IReadOnlyList<ResumeEducationDto> Education,
    IReadOnlyList<ProjectCardDto> Projects,
    IReadOnlyList<SkillGroupDto> Skills,
    IReadOnlyList<CertificationDto> Certifications);

/// <summary>
/// A qualification, lifted from the timeline's education milestones.
/// </summary>
/// <remarks>
/// Education has no entity of its own and does not need one — it is a dated life event
/// with a title, which is what <c>Milestone</c> already is. Giving it a second home would
/// mean a graduation that appears on the timeline but not the CV, or the reverse.
/// </remarks>
public sealed record ResumeEducationDto(
    string Title,
    string? Detail,
    DateOnly StartDate,
    DateOnly? EndDate);
