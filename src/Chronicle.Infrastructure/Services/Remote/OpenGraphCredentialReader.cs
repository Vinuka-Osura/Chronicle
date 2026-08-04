using System.Net;
using System.Text.RegularExpressions;
using Chronicle.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace Chronicle.Infrastructure.Services.Remote;

/// <summary>
/// Reads Open Graph tags out of a credential share link.
/// </summary>
/// <remarks>
/// <para>
/// Deliberately a regex over the response head rather than an HTML parser. The target is
/// four <c>&lt;meta&gt;</c> tags in a document whose entire purpose is to carry them, and
/// adding an HTML parsing dependency to read two attributes would be the larger risk.
/// Only the first 64 KB is read, because Open Graph tags are in <c>&lt;head&gt;</c> and a
/// page that has not declared them by then does not have them.
/// </para>
/// </remarks>
public sealed partial class OpenGraphCredentialReader(HttpClient http, ILogger<OpenGraphCredentialReader> logger)
    : ICredentialLinkReader
{
    /*
      An allowlist, and this is the security control that makes the feature safe.

      The URL arrives from a form. Fetching an arbitrary attacker-chosen address from the
      server is SSRF: `http://169.254.169.254/` is the cloud metadata endpoint, and
      `http://localhost:5432` is the database. Blocking private ranges is the usual
      mitigation and it is genuinely hard to get right — DNS rebinding, IPv6-mapped IPv4,
      redirects to a second host, and every encoding trick in between.

      The set of organisations that issue credentials is small and known, so an allowlist
      is both stronger and simpler: anything not on it is never resolved at all. Adding an
      issuer is one line here and a deliberate decision, which is the correct friction.
    */
    private static readonly string[] AllowedHosts =
    [
        "learn.microsoft.com",
        "www.credly.com",
        "credly.com",
        "www.youracclaim.com",
        "training.linuxfoundation.org",
        "www.coursera.org",
        "coursera.org",
        "aws.amazon.com",
    ];

    /// <summary>Open Graph lives in the head; anything past this is the body.</summary>
    private const int MaxBytes = 64 * 1024;

    public async Task<CredentialLink?> ReadAsync(string url, CancellationToken cancellationToken = default)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri)
            || uri.Scheme != Uri.UriSchemeHttps
            || !AllowedHosts.Contains(uri.Host, StringComparer.OrdinalIgnoreCase))
        {
            CredentialLog.HostNotAllowed(logger, uri?.Host ?? url);
            return null;
        }

        try
        {
            using var response = await http
                .GetAsync(uri, HttpCompletionOption.ResponseHeadersRead, cancellationToken)
                .ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
            {
                CredentialLog.ReadFailed(logger, uri.Host, (int)response.StatusCode);
                return null;
            }

            var head = await ReadHeadAsync(response, cancellationToken).ConfigureAwait(false);

            var title = Meta(head, "og:title");
            var image = Meta(head, "og:image");

            return title is null && image is null ? null : new CredentialLink(title, image);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            CredentialLog.ReadThrew(logger, uri.Host, ex);
            return null;
        }
    }

    private static async Task<string> ReadHeadAsync(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);

        var buffer = new byte[MaxBytes];
        var read = 0;

        while (read < MaxBytes)
        {
            var got = await stream
                .ReadAsync(buffer.AsMemory(read, MaxBytes - read), cancellationToken)
                .ConfigureAwait(false);

            if (got == 0)
            {
                break;
            }

            read += got;
        }

        return System.Text.Encoding.UTF8.GetString(buffer, 0, read);
    }

    /// <summary>The content of one Open Graph tag, with entities decoded.</summary>
    private static string? Meta(string html, string property)
    {
        var match = MetaTag(property).Match(html);

        return match.Success && match.Groups["content"].Value is { Length: > 0 } value
            ? WebUtility.HtmlDecode(value).Trim()
            : null;
    }

    /// <summary>
    /// Matches the tag in either attribute order.
    /// </summary>
    /// <remarks>
    /// <c>property</c> then <c>content</c> is what the spec shows and what most emitters
    /// produce, but the order is not guaranteed and a one-sided pattern silently reads
    /// nothing on the pages that reverse it.
    /// </remarks>
    private static Regex MetaTag(string property) => new(
        $"""<meta[^>]+?(?:property|name)=["']{Regex.Escape(property)}["'][^>]*?content=["'](?<content>[^"']*)["']|<meta[^>]+?content=["'](?<content>[^"']*)["'][^>]*?(?:property|name)=["']{Regex.Escape(property)}["']""",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant,
        TimeSpan.FromSeconds(2));
}

internal static partial class CredentialLog
{
    [LoggerMessage(EventId = 3101, Level = LogLevel.Warning,
        Message = "Credential link host {Host} is not on the allowlist, so it was not read.")]
    public static partial void HostNotAllowed(ILogger logger, string host);

    [LoggerMessage(EventId = 3102, Level = LogLevel.Warning,
        Message = "Reading the credential link from {Host} returned {StatusCode}.")]
    public static partial void ReadFailed(ILogger logger, string host, int statusCode);

    [LoggerMessage(EventId = 3103, Level = LogLevel.Warning,
        Message = "Reading the credential link from {Host} failed.")]
    public static partial void ReadThrew(ILogger logger, string host, Exception exception);
}
