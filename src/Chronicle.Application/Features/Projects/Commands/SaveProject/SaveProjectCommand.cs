using Chronicle.Application.Common.Content;
using FluentValidation;
using MediatR;

namespace Chronicle.Application.Features.Projects.Commands.SaveProject;

/// <summary>
/// Creates or updates a case study. A null <paramref name="Id"/> means it is new.
/// </summary>
/// <remarks>
/// The optional Markdown sections are what separate a flagship project from a small one:
/// leaving them null is a real editorial choice, and the public page hides the sections
/// rather than rendering empty headings.
/// </remarks>
public sealed record SaveProjectCommand(
    Guid? Id,
    string Title,
    string Slug,
    string Pitch,
    string Problem,
    string Solution,
    string? KeyDecisions,
    string? ArchitectureNotes,
    string? ArchitectureDiagramUrl,
    string? ArchitectureDiagram,
    string? Metrics,
    string? Results,
    string? LessonsLearned,
    string? VideoUrl,
    string? GithubUrl,
    string? DemoUrl,
    string? DocsUrl,
    DateOnly StartDate,
    DateOnly? EndDate,
    bool Featured,
    int SortOrder,
    IReadOnlyList<string> Tags,
    IReadOnlyList<string> TechStack,
    /// <summary>The organisation that owns the work. Null for a personal project.</summary>
    string? Owner = null,
    string? OwnerUrl = null,
    /// <summary>Required whenever <paramref name="Owner"/> is set.</summary>
    string? PermissionNote = null,
    string? EvidenceUrl = null) : IRequest<Guid>;

public sealed class SaveProjectCommandValidator : AbstractValidator<SaveProjectCommand>
{
    public SaveProjectCommandValidator()
    {
        RuleFor(c => c.Title).NotEmpty().MaximumLength(200);

        RuleFor(c => c.Slug)
            .NotEmpty()
            .MaximumLength(200)
            .Matches("^[a-z0-9]+(-[a-z0-9]+)*$")
            .WithMessage("Use lowercase letters, numbers and single hyphens, e.g. 'core-banking-ledger'.");

        RuleFor(c => c.Pitch).NotEmpty().MaximumLength(300);
        RuleFor(c => c.ArchitectureDiagram).MaximumLength(2000);
        RuleFor(c => c.Problem).NotEmpty();
        RuleFor(c => c.Solution).NotEmpty();

        RuleFor(c => c.EndDate)
            .GreaterThanOrEqualTo(c => c.StartDate)
            .When(c => c.EndDate.HasValue)
            .WithMessage("A project cannot finish before it started. Leave the end date empty if it is ongoing.");

        // Every operator-supplied link goes through the same check: absolute http(s)
        // only. See Common/Content/Urls for why that is a security rule rather than a
        // formatting preference.
        foreach (var url in new[]
        {
            (Selector: (Func<SaveProjectCommand, string?>)(c => c.ArchitectureDiagramUrl), Name: "Diagram URL"),
            (c => c.VideoUrl, "Video URL"),
            (c => c.GithubUrl, "GitHub URL"),
            (c => c.DemoUrl, "Demo URL"),
            (c => c.DocsUrl, "Docs URL"),
            (c => c.OwnerUrl, "Owner URL"),
            (c => c.EvidenceUrl, "Evidence URL")
        })
        {
            RuleFor(c => url.Selector(c))
                .Must(Urls.IsAbsoluteHttp)
                .When(c => !string.IsNullOrWhiteSpace(url.Selector(c)))
                .WithName(url.Name)
                .WithMessage("Must be a full http(s) address.");
        }

        RuleFor(c => c.Owner).MaximumLength(150);
        RuleFor(c => c.PermissionNote).MaximumLength(300);

        /*
          Naming somebody else's organisation on a public page is a claim about them, so
          the claim has to come with the sentence that says they agreed to it.

          Checked here AND by a database check constraint, deliberately. This one exists
          to give the editor a sentence they can act on; the constraint exists because a
          seeder, a migration or a direct UPDATE never sees this validator, and the pairing
          is the whole safeguard rather than a nicety.
        */
        RuleFor(c => c.PermissionNote)
            .NotEmpty()
            .When(c => !string.IsNullOrWhiteSpace(c.Owner))
            .WithName("Permission")
            .WithMessage(
                "Say how permission to publish was given. Naming an organisation without it "
                + "is a claim about them that the page cannot back up.");

        RuleForEach(c => c.Tags).NotEmpty().MaximumLength(60);
        RuleForEach(c => c.TechStack).NotEmpty().MaximumLength(60);
    }
}
