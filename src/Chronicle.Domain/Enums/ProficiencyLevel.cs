namespace Chronicle.Domain.Enums;

/// <summary>
/// Self-assessed depth, 1-5. Values are explicit and start at 1 so the stored int
/// reads the same as the level shown in the UI meter.
/// </summary>
public enum ProficiencyLevel
{
    Novice = 1,
    Working = 2,
    Proficient = 3,
    Advanced = 4,
    Expert = 5
}
