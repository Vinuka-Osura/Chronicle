using Chronicle.Domain.Enums;

namespace Chronicle.Application.Features.Learning;

/// <summary>A topic currently being studied, on the Knowledge Core learning board.</summary>
public sealed record LearningItemDto(
    string Topic,
    string Note,
    LearningStatus Status,
    /// <summary>0-100, or null to render the card without a meter.</summary>
    int? ProgressPercent,
    string? Link);
