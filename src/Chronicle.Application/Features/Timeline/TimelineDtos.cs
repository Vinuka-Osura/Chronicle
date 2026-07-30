namespace Chronicle.Application.Features.Timeline;

/// <summary>
/// The whole timeline in one response.
/// </summary>
/// <remarks>
/// An object rather than the bare array the original spec described, because eras came
/// later. Repeating an era's name and range on every item belonging to it would be
/// waste, and the client needs the era list on its own to draw the scrubber.
/// </remarks>
/// <param name="Today">
/// The server's date. Sent so client and server cannot disagree about where the "today"
/// boundary sits — a visitor with a wrong system clock would otherwise see it misplaced.
/// </param>
public sealed record TimelineResponse(
    DateOnly Today,
    IReadOnlyList<TimelineEraDto> Eras,
    IReadOnlyList<TimelineItemDto> Items);

/// <param name="EndDate">Null means the era is still running, or is the open-ended future one.</param>
public sealed record TimelineEraDto(
    Guid Id,
    string Name,
    string? Tagline,
    DateOnly StartDate,
    DateOnly? EndDate);

/// <param name="Type">experience | project | certification | milestone | roadmap.</param>
/// <param name="Track">career | life. Which side of the spine this sits on.</param>
/// <param name="EraId">Null when no era covers this date; the item then renders under its year alone.</param>
public sealed record TimelineItemDto(
    string Type,
    string Track,
    Guid? EraId,
    DateOnly Date,
    DateOnly? EndDate,
    string Title,
    string? Subtitle,
    string? Summary,
    string? Slug,
    string? Status,
    string? Category,
    string? Link,
    IReadOnlyList<string> Highlights,
    IReadOnlyList<string> TechStack,
    IReadOnlyList<string> Tags,
    IReadOnlyList<TimelineConnectionDto> Connections);

/// <param name="Kind">project | article | skill | experience.</param>
/// <param name="Slug">Set where the target has its own page; null otherwise.</param>
/// <param name="Via">Why these are connected, so the reader is never left guessing.</param>
public sealed record TimelineConnectionDto(string Kind, string Title, string? Slug, string Via);
