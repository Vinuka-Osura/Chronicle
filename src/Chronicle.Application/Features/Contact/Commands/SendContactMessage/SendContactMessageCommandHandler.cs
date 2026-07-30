using Chronicle.Application.Common.Interfaces;
using MediatR;

namespace Chronicle.Application.Features.Contact.Commands.SendContactMessage;

/// <remarks>
/// Nothing is persisted. A contact message is a notification, not content: storing it
/// would mean a table of personal data to secure, back up and eventually delete, in
/// exchange for a copy of something already in an inbox.
/// </remarks>
public sealed class SendContactMessageCommandHandler(IEmailService email)
    : IRequestHandler<SendContactMessageCommand>
{
    public Task Handle(SendContactMessageCommand request, CancellationToken cancellationToken)
    {
        // Validation, including the honeypot, has already run in ValidationBehaviour.
        return email.SendContactMessageAsync(
            request.Name,
            request.Email,
            request.Message,
            cancellationToken);
    }
}
