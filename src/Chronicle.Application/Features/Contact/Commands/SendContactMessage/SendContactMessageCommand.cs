using FluentValidation;
using MediatR;

namespace Chronicle.Application.Features.Contact.Commands.SendContactMessage;

/// <param name="Website">
/// Honeypot. Hidden from humans in the form, so anything that fills it is a bot.
/// Named plausibly on purpose — a field called "honeypot" defeats the point.
/// </param>
public sealed record SendContactMessageCommand(
    string Name,
    string Email,
    string Message,
    string? Website = null) : IRequest;

public sealed class SendContactMessageCommandValidator : AbstractValidator<SendContactMessageCommand>
{
    public SendContactMessageCommandValidator()
    {
        RuleFor(c => c.Name)
            .NotEmpty().WithMessage("Tell me who you are.")
            .MaximumLength(100);

        RuleFor(c => c.Email)
            .NotEmpty().WithMessage("I need an address to reply to.")
            .EmailAddress().WithMessage("That does not look like an email address.")
            .MaximumLength(200);

        RuleFor(c => c.Message)
            .NotEmpty().WithMessage("The message is empty.")
            .MinimumLength(10).WithMessage("A little more detail would help.")
            .MaximumLength(4000);

        // The honeypot must be empty. Phrased as an ordinary validation failure so a bot
        // learns nothing from the response about why it was rejected.
        RuleFor(c => c.Website)
            .Empty().WithMessage("That request could not be processed.");
    }
}
