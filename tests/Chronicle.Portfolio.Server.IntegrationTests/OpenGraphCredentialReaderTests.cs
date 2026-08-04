using System.Net;
using Chronicle.Infrastructure.Services.Remote;
using Microsoft.Extensions.Logging.Abstractions;

namespace Chronicle.Portfolio.Server.IntegrationTests;

/// <summary>
/// Reading a credential's name and badge out of a share link.
/// </summary>
/// <remarks>
/// <para>
/// No database and no network: the HTTP layer is a stub handler, so these run offline and
/// pin the two things that actually matter — that the allowlist holds, and that the tag
/// parsing survives the shapes real issuers emit.
/// </para>
/// <para>
/// <b>The allowlist cases are the important half.</b> This fetches a URL typed into an
/// admin form, which is server-side request forgery unless something stops it. Every
/// rejection below is a request that must never leave the process.
/// </para>
/// </remarks>
public class OpenGraphCredentialReaderTests
{
    /// <summary>Answers every request with one canned body, and records what was asked for.</summary>
    private sealed class StubHandler(string body, HttpStatusCode status = HttpStatusCode.OK)
        : HttpMessageHandler
    {
        public Uri? Requested { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            Requested = request.RequestUri;
            return Task.FromResult(new HttpResponseMessage(status)
            {
                Content = new StringContent(body),
            });
        }
    }

    private static (OpenGraphCredentialReader Reader, StubHandler Handler) Build(
        string body,
        HttpStatusCode status = HttpStatusCode.OK)
    {
        var handler = new StubHandler(body, status);
        var reader = new OpenGraphCredentialReader(
            new HttpClient(handler),
            NullLogger<OpenGraphCredentialReader>.Instance);

        return (reader, handler);
    }

    /// <summary>The head Microsoft Learn actually returns for a credential share link.</summary>
    private const string LearnCredential = """
        <!DOCTYPE html><html lang="en-gb"><head>
        <title>Microsoft Certified: Azure Fundamentals</title>
        <meta charset="utf-8">
        <meta property="og:title" content="Microsoft Certified: Azure Fundamentals">
        <meta property="og:type" content="website">
        <meta property="og:image" content="https://learn.microsoft.com/en-us/media/learn/certification/badges/microsoft-certified-general-badge-social.png">
        <meta property="og:description" content="">
        </head><body></body></html>
        """;

    [Fact]
    public async Task Reads_the_name_and_badge_from_a_Microsoft_Learn_credential()
    {
        var (reader, _) = Build(LearnCredential);

        var link = await reader.ReadAsync(
            "https://learn.microsoft.com/api/credentials/share/en-gb/Example-1234/ABCDEF?sharingId=1234");

        link.ShouldNotBeNull();
        link.Title.ShouldBe("Microsoft Certified: Azure Fundamentals");
        link.ImageUrl.ShouldBe(
            "https://learn.microsoft.com/en-us/media/learn/certification/badges/microsoft-certified-general-badge-social.png");
    }

    /// <summary>
    /// The achievements endpoint is a different route on the same host and returns the same
    /// shape, which is what makes one reader enough for both.
    /// </summary>
    [Fact]
    public async Task Reads_a_Microsoft_Learn_achievement_the_same_way()
    {
        var (reader, _) = Build("""
            <html><head>
            <meta property="og:title" content="Monitor your Azure virtual machines with Azure Monitor">
            <meta property="og:image" content="https://learn.microsoft.com/training/achievements/monitor-social.png">
            </head></html>
            """);

        var link = await reader.ReadAsync(
            "https://learn.microsoft.com/api/achievements/share/en-gb/Example-1234/DUKZ5UHJ?sharingId=1234");

        link!.Title.ShouldBe("Monitor your Azure virtual machines with Azure Monitor");
    }

    /// <summary>
    /// The attribute order is not guaranteed, and a one-sided pattern reads nothing on the
    /// emitters that reverse it — silently, which is the worst way to be wrong.
    /// </summary>
    [Fact]
    public async Task Reads_a_tag_with_content_before_property()
    {
        var (reader, _) = Build(
            """<html><head><meta content="Reversed Order Badge" property="og:title"></head></html>""");

        var link = await reader.ReadAsync("https://www.credly.com/badges/abc/public_url");

        link!.Title.ShouldBe("Reversed Order Badge");
    }

    [Fact]
    public async Task Decodes_html_entities_in_the_title()
    {
        var (reader, _) = Build(
            """<html><head><meta property="og:title" content="Networking &amp; Security"></head></html>""");

        var link = await reader.ReadAsync("https://learn.microsoft.com/api/credentials/share/x/y/z");

        link!.Title.ShouldBe("Networking & Security");
    }

    // -----------------------------------------------------------------------
    // The allowlist. Every case here is a request that must not be made.
    // -----------------------------------------------------------------------

    [Theory]
    // Cloud metadata: the classic SSRF target, and it answers to anything that asks.
    [InlineData("https://169.254.169.254/latest/meta-data/")]
    [InlineData("https://metadata.google.internal/computeMetadata/v1/")]
    // Services on the host itself.
    [InlineData("https://localhost:5432/")]
    [InlineData("https://127.0.0.1/")]
    [InlineData("https://[::1]/")]
    // Private ranges.
    [InlineData("https://10.0.0.1/")]
    [InlineData("https://192.168.1.1/")]
    // A host that merely looks like an allowed one.
    [InlineData("https://learn.microsoft.com.evil.example/badge")]
    [InlineData("https://evil.example/learn.microsoft.com")]
    // Not a credential issuer.
    [InlineData("https://example.com/badge")]
    public async Task Refuses_any_host_not_on_the_allowlist(string url)
    {
        var (reader, handler) = Build(LearnCredential);

        var link = await reader.ReadAsync(url);

        link.ShouldBeNull();
        handler.Requested.ShouldBeNull("the request must never leave the process");
    }

    /// <summary>
    /// http is refused even on an allowed host: it is downgradeable and interceptable, and
    /// every issuer here serves https.
    /// </summary>
    [Theory]
    [InlineData("http://learn.microsoft.com/api/credentials/share/x/y/z")]
    [InlineData("file:///etc/passwd")]
    [InlineData("ftp://learn.microsoft.com/x")]
    [InlineData("not a url at all")]
    [InlineData("")]
    public async Task Refuses_anything_that_is_not_https(string url)
    {
        var (reader, handler) = Build(LearnCredential);

        (await reader.ReadAsync(url)).ShouldBeNull();
        handler.Requested.ShouldBeNull();
    }

    // -----------------------------------------------------------------------
    // Degrading rather than throwing
    // -----------------------------------------------------------------------

    [Fact]
    public async Task Returns_null_when_the_page_has_no_open_graph_tags() =>
        (await Build("<html><head><title>Nothing here</title></head></html>").Reader
            .ReadAsync("https://learn.microsoft.com/api/credentials/share/x/y/z"))
        .ShouldBeNull();

    [Fact]
    public async Task Returns_null_on_a_failed_response() =>
        (await Build(LearnCredential, HttpStatusCode.NotFound).Reader
            .ReadAsync("https://learn.microsoft.com/api/credentials/share/x/y/z"))
        .ShouldBeNull();

    /// <summary>
    /// A link with an image and no title is still worth having — the editor types the name
    /// and the badge is the part that is tedious to find.
    /// </summary>
    [Fact]
    public async Task Returns_the_image_even_when_the_title_is_missing()
    {
        var (reader, _) = Build(
            """<html><head><meta property="og:image" content="https://learn.microsoft.com/b.png"></head></html>""");

        var link = await reader.ReadAsync("https://learn.microsoft.com/api/credentials/share/x/y/z");

        link!.Title.ShouldBeNull();
        link.ImageUrl.ShouldBe("https://learn.microsoft.com/b.png");
    }
}
