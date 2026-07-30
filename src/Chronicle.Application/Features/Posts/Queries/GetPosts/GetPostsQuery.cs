using FluentValidation;
using MediatR;

namespace Chronicle.Application.Features.Posts.Queries.GetPosts;

/// <param name="Tag">Optional tag slug filter.</param>
public sealed record GetPostsQuery(string? Tag = null) : IRequest<IReadOnlyList<PostCardDto>>;

public sealed class GetPostsQueryValidator : AbstractValidator<GetPostsQuery>
{
    public GetPostsQueryValidator()
    {
        // Slugs are lowercase and hyphenated everywhere. Rejecting anything else turns a
        // malformed query string into a clean 400 rather than a silently empty list.
        When(q => !string.IsNullOrWhiteSpace(q.Tag), () =>
            RuleFor(q => q.Tag!)
                .MaximumLength(60)
                .Matches("^[a-z0-9]+(-[a-z0-9]+)*$")
                .WithMessage("Tag must be a lowercase, hyphenated slug."));
    }
}
