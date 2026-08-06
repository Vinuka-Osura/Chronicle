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
    string? ThumbnailUrl,
    /// <summary>
    /// The organisation that owns the work, or null for a personal project.
    /// </summary>
    /// <remarks>
    /// On the card because the projects page GROUPS by it. Grouping client-side from the
    /// list already fetched avoids a second round trip for a field the card needs anyway.
    /// </remarks>
    string? Owner);

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
    IReadOnlyList<ProjectMetricDto> Metrics,
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
    IReadOnlyList<ScreenshotDto> Screenshots,
    /// <summary>Null for a personal project.</summary>
    string? Owner,
    string? OwnerUrl,
    /// <summary>
    /// How permission to publish was given. Always present when <paramref name="Owner"/>
    /// is — a database check constraint enforces the pair, because naming a company on a
    /// public page is a claim about them and the note is what says they agreed to it.
    /// </summary>
    string? PermissionNote,
    string? EvidenceUrl);

public sealed record ScreenshotDto(string Url, string? Caption);

/// <summary>One headline number from a project's results.</summary>
public sealed record ProjectMetricDto(string Label, string Value, string? Note);
