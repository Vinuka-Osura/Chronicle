namespace Chronicle.Infrastructure.Services;

/// <summary>
/// SMTP settings, bound from the <c>Smtp:*</c> configuration section.
/// </summary>
/// <remarks>
/// Belongs in user-secrets locally and deployment secrets in production — never in
/// appsettings.json, because this repository is public.
/// <para>
/// Not validated at startup. With SMTP unconfigured the site still runs and every other
/// page works; only the contact form is unavailable, and it says so rather than the
/// application refusing to boot.
/// </para>
/// </remarks>
public sealed class SmtpOptions
{
    public const string SectionName = "Smtp";

    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public bool UseStartTls { get; set; } = true;

    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;

    /// <summary>Envelope sender. Many providers reject a From that is not a mailbox they own.</summary>
    public string FromAddress { get; set; } = string.Empty;
    public string FromName { get; set; } = "Chronicle contact form";

    /// <summary>Where messages are delivered.</summary>
    public string ToAddress { get; set; } = string.Empty;

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(Host)
        && !string.IsNullOrWhiteSpace(FromAddress)
        && !string.IsNullOrWhiteSpace(ToAddress);
}
