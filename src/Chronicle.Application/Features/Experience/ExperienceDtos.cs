namespace Chronicle.Application.Features.Experience;

/// <summary>A role held, as shown on the timeline and the résumé.</summary>
public sealed record ExperienceDto(
    Guid Id,
    string Role,
    string Company,
    DateOnly StartDate,
    /// <summary>Null means current.</summary>
    DateOnly? EndDate,
    string Summary,
    IReadOnlyList<string> Highlights,
    IReadOnlyList<string> TechStack);
