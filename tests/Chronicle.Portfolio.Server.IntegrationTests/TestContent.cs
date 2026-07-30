using Chronicle.Application.Features.Projects.Commands.SaveProject;

namespace Chronicle.Portfolio.Server.IntegrationTests;

/// <summary>
/// Builders for the commands tests need but do not care about the details of.
/// </summary>
/// <remarks>
/// <para>
/// <b>Why this exists:</b> <c>SaveProjectCommand</c> has twenty-odd positional
/// parameters, most of them optional in spirit and none of them optional to the
/// compiler. Three separate test files had each written out their own run of
/// <c>null, null, null…</c>, and adding one field to the command broke all three — three
/// times in a row now, each time miscounting the nulls and putting a value in the wrong
/// slot.
/// </para>
/// <para>
/// One factory with named arguments means the next field is one edit here, and a
/// misplaced value is a compile error rather than a test that quietly asserts against
/// the wrong column.
/// </para>
/// </remarks>
internal static class TestContent
{
    public static SaveProjectCommand Project(
        string title = "Core Banking Ledger",
        string slug = "core-banking-ledger",
        IReadOnlyList<string>? techStack = null,
        IReadOnlyList<string>? tags = null,
        string? keyDecisions = null,
        string? results = null,
        string? metrics = null,
        string? architectureDiagram = null,
        string? githubUrl = null,
        DateOnly? startDate = null,
        DateOnly? endDate = null,
        bool featured = false) => new(
            Id: null,
            Title: title,
            Slug: slug,
            Pitch: "A one-line pitch.",
            Problem: "The problem it solved.",
            Solution: "How it solved it.",
            KeyDecisions: keyDecisions,
            ArchitectureNotes: null,
            ArchitectureDiagramUrl: null,
            ArchitectureDiagram: architectureDiagram,
            Metrics: metrics,
            Results: results,
            LessonsLearned: null,
            VideoUrl: null,
            GithubUrl: githubUrl,
            DemoUrl: null,
            DocsUrl: null,
            StartDate: startDate ?? new DateOnly(2025, 1, 1),
            EndDate: endDate,
            Featured: featured,
            SortOrder: 0,
            Tags: tags ?? [],
            TechStack: techStack ?? []);
}
