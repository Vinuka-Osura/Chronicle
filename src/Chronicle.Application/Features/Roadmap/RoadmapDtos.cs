using Chronicle.Domain.Enums;

namespace Chronicle.Application.Features.Roadmap;

/// <summary>
/// A stated future goal. Rendered below the Timeline's "today" marker, styled so it
/// cannot be mistaken for something already achieved.
/// </summary>
public sealed record RoadmapItemDto(
    string Title,
    string Description,
    DateOnly TargetDate,
    RoadmapStatus Status);
