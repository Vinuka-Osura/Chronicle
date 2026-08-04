using System.Globalization;
using System.Net;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using Chronicle.Application.Common.Models;
using Chronicle.Domain.Entities;

namespace Chronicle.Infrastructure.Services.Remote;

/// <summary>
/// Published articles from a Medium RSS feed.
/// </summary>
/// <remarks>
/// <para>
/// Medium retired its public API, so the feed is what remains. It carries titles, links,
/// dates, tags and a description — and nothing else. <b>Claps, views and reads are not
/// available</b> through any free official route; they live in Medium's internal systems.
/// Those are the numbers a portfolio would most want, and their absence is stated on the
/// page rather than worked around.
/// </para>
/// <para>
/// XML, not JSON, so this is the one provider that does not use <c>System.Text.Json</c>.
/// <c>System.Xml.Linq</c> is in the BCL — no package, and RSS is small enough that loading
/// the document whole is the right trade.
/// </para>
/// </remarks>
public sealed partial class MediumProvider(HttpClient http) : IRemoteStatsProvider<MediumFeed>
{
    public string Name => "medium";

    /// <summary>Stored without the leading @, but tolerated if someone types one in.</summary>
    public string? Handle(Profile profile) => profile.MediumUsername?.TrimStart('@');

    /// <summary>The namespace Medium puts the full article body in.</summary>
    private static readonly XNamespace Content = "http://purl.org/rss/1.0/modules/content/";

    public async Task<MediumFeed?> FetchAsync(string handle, CancellationToken cancellationToken)
    {
        var xml = await http
            .GetStringAsync($"feed/@{Uri.EscapeDataString(handle)}", cancellationToken)
            .ConfigureAwait(false);

        if (string.IsNullOrWhiteSpace(xml))
        {
            return null;
        }

        XDocument document;

        try
        {
            document = XDocument.Parse(xml);
        }
        catch (System.Xml.XmlException)
        {
            // A feed that is not well-formed XML is an answer we cannot read, not a failure
            // to answer. Empty means the section does not render; null would retry for ever.
            return new MediumFeed();
        }

        var articles = new List<MediumArticle>();

        foreach (var item in document.Descendants("item"))
        {
            var title = (string?)item.Element("title");
            var link = (string?)item.Element("link");

            if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(link))
            {
                continue;
            }

            articles.Add(new MediumArticle(
                Title: title.Trim(),
                // Medium appends tracking parameters to feed links. The article is the
                // path; the query is theirs, not something to republish.
                Url: StripQuery(link.Trim()),
                PublishedAt: ParseDate((string?)item.Element("pubDate")),
                Summary: Summarise(item),
                ImageUrl: FirstImage(item),
                Tags: [.. item.Elements("category")
                    .Select(c => ((string?)c ?? string.Empty).Trim())
                    .Where(c => c.Length > 0)]));
        }

        return new MediumFeed([.. articles.OrderByDescending(a => a.PublishedAt)]);
    }

    /// <summary>
    /// A short plain-text lead-in, taken from the article body.
    /// </summary>
    /// <remarks>
    /// Medium's <c>description</c> element is the full HTML article, not a summary, so it
    /// is stripped of tags and cut to a sentence or two. Done here rather than on the
    /// client because the alternative is shipping an entire article's markup to a browser
    /// to display forty words of it.
    /// </remarks>
    private static string? Summarise(XElement item)
    {
        var html = (string?)item.Element("description")
            ?? (string?)item.Element(Content + "encoded");

        if (string.IsNullOrWhiteSpace(html))
        {
            return null;
        }

        var text = System.Text.RegularExpressions.Regex.Replace(html, "<[^>]+>", " ");
        text = System.Net.WebUtility.HtmlDecode(text);
        text = System.Text.RegularExpressions.Regex.Replace(text, @"\s+", " ").Trim();

        if (text.Length == 0)
        {
            return null;
        }

        return text.Length <= 220 ? text : $"{text[..219].TrimEnd()}…";
    }

    /// <summary>
    /// The article's own picture, taken from the first image in its body.
    /// </summary>
    /// <remarks>
    /// RSS has no field for a cover image and Medium sends none, but the full article HTML
    /// is already in <c>content:encoded</c> — which this class parses anyway for the
    /// summary. So the picture costs no extra request and no extra parse pass; it is
    /// simply the first <c>&lt;img&gt;</c> Medium chose to put at the top of the piece.
    /// <para>
    /// Data URIs are skipped: Medium occasionally inlines a tiny placeholder ahead of the
    /// real image, and a 40-byte grey square is worse than no picture at all.
    /// </para>
    /// </remarks>
    private static string? FirstImage(XElement item)
    {
        var html = (string?)item.Element(Content + "encoded")
            ?? (string?)item.Element("description");

        if (string.IsNullOrWhiteSpace(html))
        {
            return null;
        }

        foreach (Match match in ImagePattern().Matches(html))
        {
            var src = WebUtility.HtmlDecode(match.Groups["src"].Value).Trim();

            if (src.Length > 0 && src.StartsWith("http", StringComparison.OrdinalIgnoreCase))
            {
                return src;
            }
        }

        return null;
    }

    [GeneratedRegex("""<img[^>]+?src=["'](?<src>[^"']+)["']""",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex ImagePattern();

    private static string StripQuery(string url)
    {
        var mark = url.IndexOf('?', StringComparison.Ordinal);
        return mark < 0 ? url : url[..mark];
    }

    /// <summary>RFC 1123, which is what RSS specifies and Medium actually sends.</summary>
    private static DateTimeOffset ParseDate(string? value) =>
        DateTimeOffset.TryParse(
            value,
            CultureInfo.InvariantCulture,
            DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
            out var parsed)
            ? parsed
            : DateTimeOffset.UnixEpoch;
}
