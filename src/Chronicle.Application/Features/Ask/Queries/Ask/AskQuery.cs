using FluentValidation;
using MediatR;

namespace Chronicle.Application.Features.Ask.Queries.Ask;

/// <param name="Question">What the visitor typed.</param>
public sealed record AskQuery(string Question) : IRequest<AskAnswerDto>;

public sealed class AskQueryValidator : AbstractValidator<AskQuery>
{
    /*
      Long enough for a real sentence, short enough that the endpoint cannot be used as a
      way to push arbitrary payloads through the rate limiter. Nobody asks a portfolio a
      three-hundred-character question.
    */
    public AskQueryValidator()
    {
        RuleFor(q => q.Question)
            .NotEmpty()
            .WithMessage("Ask something.")
            .MaximumLength(300)
            .WithMessage("Questions are capped at 300 characters.");
    }
}
