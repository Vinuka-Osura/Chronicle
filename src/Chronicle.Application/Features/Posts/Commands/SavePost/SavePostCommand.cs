using FluentValidation;
using MediatR;

namespace Chronicle.Application.Features.Posts.Commands.SavePost;

/// <summary>
/// Creates or updates an article.
/// </summary>
/// <remarks>
/// One upsert rather than a Create and an Update pair. They would carry an identical
/// field list and identical validation, and the operator is doing one thing either way -
/// writing an article. A null <paramref name="Id"/> means it is new.
/// </remarks>
/// <param name="Tags">Tag names as typed. Unknown names are created; the join is replaced wholesale.</param>
public sealed record SavePostCommand(
    Guid? Id,
    string Title,
    string Slug,
    string Excerpt,
    string BodyMarkdown,
    bool IsPublished,
    IReadOnlyList<string> Tags,
    /// <summary>Set when the article lives elsewhere; the card then links out.</summary>
    string? ExternalUrl,
    string? CoverImageUrl) : IRequest<Guid>;

public sealed class SavePostCommandValidator : AbstractValidator<SavePostCommand>
{
    public SavePostCommandValidator()
    {
        RuleFor(c => c.Title).NotEmpty().MaximumLength(200);

        RuleFor(c => c.Slug)
            .NotEmpty()
            .MaximumLength(200)
            // Anchored, and the character class excludes the separators that would let a
            // slug escape its route segment or collide with a query string.
            .Matches("^[a-z0-9]+(-[a-z0-9]+)*$")
            .WithMessage("Use lowercase letters, numbers and single hyphens, e.g. 'why-i-stopped-using-automapper'.");

        RuleFor(c => c.Excerpt).NotEmpty().MaximumLength(400);

        // A row that points at an article published elsewhere has no body of its own, so
        // the body is required only when there is nothing to point at.
        RuleFor(c => c.BodyMarkdown)
            .NotEmpty()
            .When(c => string.IsNullOrWhiteSpace(c.ExternalUrl))
            .WithMessage("An article hosted here needs a body. Add a link if it lives somewhere else.");

        RuleFor(c => c.ExternalUrl).MaximumLength(500)
            .Must(BeAbsoluteHttpsUrl).WithMessage("The article link needs the full https:// address.");

        RuleFor(c => c.CoverImageUrl).MaximumLength(500)
            .Must(BeAbsoluteHttpsUrl).WithMessage("The image link needs the full https:// address.");

        RuleForEach(c => c.Tags).NotEmpty().MaximumLength(60);
    }

    private static bool BeAbsoluteHttpsUrl(string? value)
        => string.IsNullOrWhiteSpace(value)
            || (Uri.TryCreate(value, UriKind.Absolute, out var uri)
                && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps));
}
