using Chronicle.Application.Features.Contact.Commands.SendContactMessage;
using MediatR;

namespace Chronicle.Portfolio.Server.Api.Endpoints;

public static class ContactEndpoints
{
    public static IEndpointRouteBuilder MapContactEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/contact", async (
                SendContactMessageCommand command,
                ISender sender,
                CancellationToken cancellationToken) =>
            {
                await sender.Send(command, cancellationToken).ConfigureAwait(false);
                // 202 rather than 200: the message has been accepted for delivery, which
                // is not the same as it having landed in an inbox.
                return Results.Accepted();
            })
            .WithTags("Contact")
            .WithName("SendContactMessage")
            .WithSummary("Send a message from the contact form")
            .WithDescription(
                "Rate-limited per address and protected by a honeypot field. Nothing is stored - " +
                "a contact message is a notification, not content.")
            .Produces(StatusCodes.Status202Accepted)
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status429TooManyRequests)
            .ProducesProblem(StatusCodes.Status503ServiceUnavailable)
            // Its own far stricter limit. The read API allows 120/minute for browsing;
            // nobody legitimately sends five messages a minute, and this endpoint costs
            // an outbound email rather than a cached read.
            .RequireRateLimiting("contact");

        return app;
    }
}
