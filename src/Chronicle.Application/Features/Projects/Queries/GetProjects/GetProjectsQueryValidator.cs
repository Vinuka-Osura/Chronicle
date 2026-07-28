using FluentValidation;

namespace Chronicle.Application.Features.Projects.Queries.GetProjects;

public sealed class GetProjectsQueryValidator : AbstractValidator<GetProjectsQuery>
{
    public GetProjectsQueryValidator()
    {
        // Slugs are lowercase and hyphenated everywhere (spec section 1). Rejecting
        // anything else turns a malformed query string into a clean 400 instead of a
        // silently empty result the caller has to guess about.
        When(q => !string.IsNullOrWhiteSpace(q.Tag), () =>
            RuleFor(q => q.Tag!)
                .MaximumLength(60)
                .Matches("^[a-z0-9]+(-[a-z0-9]+)*$")
                .WithMessage("Tag must be a lowercase, hyphenated slug."));
    }
}
