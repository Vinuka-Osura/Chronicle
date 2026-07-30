using Chronicle.Domain.Enums;

namespace Chronicle.Application.Features.Skills;

/// <summary>Skills grouped by domain, which is how the Skills page renders them.</summary>
public sealed record SkillGroupDto(SkillCategory Category, IReadOnlyList<SkillDto> Skills);

public sealed record SkillDto(
    string Name,
    SkillCategory Category,
    decimal YearsExperience,
    ProficiencyLevel Proficiency,
    /// <summary>1-5, so the UI can draw a meter without mapping the enum itself.</summary>
    int ProficiencyRank,
    /// <summary>
    /// The projects and roles that actually reference this skill. Derived from the join
    /// tables rather than stored, so it can never claim experience the work does not show.
    /// </summary>
    IReadOnlyList<SkillUsageDto> UsedIn);

/// <param name="Kind">"project" or "experience".</param>
/// <param name="Title">Display label.</param>
/// <param name="Slug">Set for projects, so the chip can link to the case study. Null for roles.</param>
public sealed record SkillUsageDto(string Kind, string Title, string? Slug);
