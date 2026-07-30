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
    IReadOnlyList<string> TechStack) : IRequest<Guid>;

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
        RuleFor(c => c.Problem).NotEmpty();
        RuleFor(c => c.Solution).NotEmpty();

        RuleFor(c => c.EndDate)
            .GreaterThanOrEqualTo(c => c.StartDate)
            .When(c => c.EndDate.HasValue)
            .WithMessage("A project cannot finish before it started. Leave the end date empty if it is ongoing.");

        foreach (var url in new[]
        {
            (Selector: (Func<SaveProjectCommand, string?>)(c => c.ArchitectureDiagramUrl), Name: "Diagram URL"),
            (c => c.VideoUrl, "Video URL"),
            (c => c.GithubUrl, "GitHub URL"),
            (c => c.DemoUrl, "Demo URL"),
            (c => c.DocsUrl, "Docs URL")
        })
        {
            RuleFor(c => url.Selector(c))
                .Must(BeAnAbsoluteHttpUrl)
                .When(c => !string.IsNullOrWhiteSpace(url.Selector(c)))
                .WithName(url.Name)
                .WithMessage("Must be a full http(s) address.");
        }

        RuleForEach(c => c.Tags).NotEmpty().MaximumLength(60);
        RuleForEach(c => c.TechStack).NotEmpty().MaximumLength(60);
    }

    /// <summary>
    /// Absolute and http(s) only. A relative value would resolve against the visitor's
    /// current page, and `javascript:` in an href is a stored cross-site scripting hole
    /// with an editor's login behind it.
    /// </summary>
    private static bool BeAnAbsoluteHttpUrl(string? value) =>
        Uri.TryCreate(value, UriKind.Absolute, out var uri)
        && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
}
