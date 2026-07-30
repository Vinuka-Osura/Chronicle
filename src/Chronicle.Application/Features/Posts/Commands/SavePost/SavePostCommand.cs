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
    IReadOnlyList<string> Tags) : IRequest<Guid>;

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
        RuleFor(c => c.BodyMarkdown).NotEmpty();

        RuleForEach(c => c.Tags).NotEmpty().MaximumLength(60);
    }
}
