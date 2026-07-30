using System.Net;
using System.Net.Mail;
using Chronicle.Application.Common.Exceptions;
using Chronicle.Application.Common.Interfaces;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Chronicle.Infrastructure.Services;

/// <summary>
/// Delivers contact-form messages over SMTP.
/// </summary>
/// <remarks>
/// Behaviour when SMTP is not configured differs by environment, deliberately. In
/// Development the message is written to the log and the request succeeds, so anyone who
/// clones this repository can exercise the whole form without standing up a mail server.
/// In Production the same situation throws, because silently swallowing a message
/// someone took the trouble to write is the worst possible outcome — better a visible
/// error telling them to email directly.
/// </remarks>
public sealed partial class SmtpEmailService(
    IOptions<SmtpOptions> options,
    IHostEnvironment environment,
    ILogger<SmtpEmailService> logger) : IEmailService
{
    public async Task SendContactMessageAsync(
        string fromName,
        string fromEmail,
        string message,
        CancellationToken cancellationToken = default)
    {
        var smtp = options.Value;

        if (!smtp.IsConfigured)
        {
            if (environment.IsDevelopment())
            {
                LogUnsentInDevelopment(logger, fromName, fromEmail, message);
                return;
            }

            LogNotConfigured(logger);
            throw new ServiceUnavailableException(
                "The contact form is not available right now. Please email directly instead.");
        }

        using var mail = new MailMessage
        {
            From = new MailAddress(smtp.FromAddress, smtp.FromName),
            // The visitor's address goes in Reply-To, never in From: sending as them
            // would fail SPF and land the mail in spam, if it arrived at all.
            Subject = $"Portfolio contact from {fromName}",
            Body = $"From: {fromName} <{fromEmail}>\n\n{message}",
            IsBodyHtml = false,
        };

        mail.To.Add(smtp.ToAddress);
        mail.ReplyToList.Add(new MailAddress(fromEmail, fromName));

        using var client = new SmtpClient(smtp.Host, smtp.Port)
        {
            EnableSsl = smtp.UseStartTls,
            Credentials = string.IsNullOrWhiteSpace(smtp.Username)
                ? null
                : new NetworkCredential(smtp.Username, smtp.Password),
        };

        try
        {
            await client.SendMailAsync(mail, cancellationToken).ConfigureAwait(false);
            LogSent(logger, fromEmail);
        }
        catch (SmtpException ex)
        {
            // The visitor is told the send failed; the reason stays in the log, since it
            // can name the mail host and its credentials policy.
            LogSendFailed(logger, ex);
            throw new ServiceUnavailableException(
                "The message could not be sent right now. Please email directly instead.", ex);
        }
    }

    [LoggerMessage(EventId = 3000, Level = LogLevel.Information,
        Message = "Contact message sent, reply-to {ReplyTo}.")]
    private static partial void LogSent(ILogger logger, string replyTo);

    [LoggerMessage(EventId = 3001, Level = LogLevel.Warning,
        Message = "SMTP is not configured, so this contact message was not sent. "
                  + "From {Name} <{Email}>: {Message}")]
    private static partial void LogUnsentInDevelopment(
        ILogger logger, string name, string email, string message);

    [LoggerMessage(EventId = 3002, Level = LogLevel.Error,
        Message = "SMTP is not configured. Set Smtp:Host, Smtp:FromAddress and Smtp:ToAddress.")]
    private static partial void LogNotConfigured(ILogger logger);

    [LoggerMessage(EventId = 3003, Level = LogLevel.Error, Message = "SMTP send failed.")]
    private static partial void LogSendFailed(ILogger logger, Exception exception);
}
