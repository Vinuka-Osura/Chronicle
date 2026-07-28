namespace Chronicle.Domain.Enums;

/// <summary>Domain grouping used by the Skills page. Stored as int, serialised as string.</summary>
public enum SkillCategory
{
    Backend = 0,
    Frontend = 1,
    Database = 2,
    DevOps = 3,
    Cloud = 4,
    AI = 5,
    Other = 6
}
