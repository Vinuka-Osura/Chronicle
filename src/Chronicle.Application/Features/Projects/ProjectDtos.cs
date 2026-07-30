namespace Chronicle.Application.Features.Projects;

/// <summary>Card shape for the projects grid and the Timeline's project nodes.</summary>
public sealed record ProjectCardDto(
    string Slug,
    string Title,
    string Pitch,
    bool Featured,
    DateOnly StartDate,
    DateOnly? EndDate,
    IReadOnlyList<string> Tags,
    IReadOnlyList<string> TechStack,
    string? ThumbnailUrl);

/// <summary>
/// Full case study: the eight-part template.
/// </summary>
/// <remarks>
/// Markdown fields are returned raw and rendered plus sanitised on the client, so the
/// API stays a content API rather than a presentation one. Optional sections come back
/// null and the page hides them.
/// </remarks>
public sealed record ProjectDetailDto(
    string Slug,
    string Title,
    string Pitch,
    string Problem,
    string Solution,
    string? KeyDecisions,
    string? ArchitectureNotes,
    string? ArchitectureDiagramUrl,
    string? ArchitectureDiagram,
    string? Results,
    string? LessonsLearned,
    string? VideoUrl,
    string? GithubUrl,
    string? DemoUrl,
    string? DocsUrl,
    DateOnly StartDate,
    DateOnly? EndDate,
    bool Featured,
    IReadOnlyList<string> Tags,
    IReadOnlyList<string> TechStack,
    IReadOnlyList<ScreenshotDto> Screenshots);

public sealed record ScreenshotDto(string Url, string? Caption);
