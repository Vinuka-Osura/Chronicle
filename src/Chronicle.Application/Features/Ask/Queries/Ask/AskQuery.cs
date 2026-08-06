using FluentValidation;
using MediatR;

namespace Chronicle.Application.Features.Ask.Queries.Ask;

/// <param name="Question">What the visitor typed.</param>
/// <param name="Question">What the visitor typed.</param>
/// <param name="Context">
/// What the previous answer was about, echoed back by the caller. This is what gives a
/// follow-up like "what projects used it?" an antecedent for "it". Optional, and never
/// trusted for anything but resolving a pronoun — it is a hint from the client, so it
/// selects among things already published rather than deciding what may be shown.
/// </param>
public sealed record AskQuery(string Question, string? Context = null) : IRequest<AskAnswerDto>;

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
