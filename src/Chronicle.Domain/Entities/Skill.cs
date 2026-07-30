using Chronicle.Domain.Common;
using Chronicle.Domain.Enums;

namespace Chronicle.Domain.Entities;

/// <summary>
/// A technology or capability.
/// </summary>
/// <remarks>
/// There is deliberately no "used in" field. That relationship is derived by querying
/// the <see cref="Project.TechStack"/> and <see cref="Experience.TechStack"/> joins, so
/// it can never disagree with the projects and roles that actually reference the skill.
/// </remarks>
public class Skill : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public SkillCategory Category { get; set; } = SkillCategory.Other;

    public decimal YearsExperience { get; set; }
    public ProficiencyLevel Proficiency { get; set; } = ProficiencyLevel.Working;

    public int SortOrder { get; set; }

    public ICollection<Project> Projects { get; set; } = new List<Project>();
    public ICollection<Experience> Experiences { get; set; } = new List<Experience>();

    /// <summary>Credentials that attest to this skill.</summary>
    public ICollection<Certification> Certifications { get; set; } = new List<Certification>();
}
