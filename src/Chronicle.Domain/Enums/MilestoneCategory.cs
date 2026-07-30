namespace Chronicle.Domain.Enums;

/// <summary>
/// What kind of life event a milestone is. Rendered as a text label on the timeline
/// card, not as a distinct shape — all milestones share one glyph, because a shape
/// vocabulary large enough to need a legend has failed.
/// </summary>
public enum MilestoneCategory
{
    Education = 0,
    Recognition = 1,
    Community = 2,
    Personal = 3
}
