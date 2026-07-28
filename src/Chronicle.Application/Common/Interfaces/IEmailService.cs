namespace Chronicle.Application.Common.Interfaces;

/// <summary>Port over outbound email, used by the contact form.</summary>
public interface IEmailService
{
    Task SendContactMessageAsync(
        string fromName,
        string fromEmail,
        string message,
        CancellationToken cancellationToken = default);
}
