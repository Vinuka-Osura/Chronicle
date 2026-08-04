namespace Chronicle.Application.Common.Interfaces;

/// <summary>
/// Reads the name and badge image out of a credential share link.
/// </summary>
/// <remarks>
/// <para>
/// Microsoft Learn has no public API for a person's credentials — the Catalog API returns
/// course metadata and nothing about anyone. What it does have is a **share link**, and a
/// share link is Open Graph: the page carries <c>og:title</c> and <c>og:image</c> precisely
/// so that LinkedIn, Slack and everything else can render a preview of it.
/// </para>
/// <para>
/// That distinction matters and is the reason this is acceptable where scraping a profile
/// page was not. Open Graph is a published contract meant for machines, stable across
/// redesigns, and reading it is the documented purpose of the tags. Parsing a rendered
/// profile for XP and trophies would have been none of those things.
/// </para>
/// <para>
/// <b>Called from the admin, never from a page render.</b> The result is written to the
/// certification row, so the public site depends on stored data and never on Microsoft
/// being reachable. It also keeps the fetch behind authentication, which matters because
/// the URL comes from a form.
/// </para>
/// </remarks>
public interface ICredentialLinkReader
{
    /// <summary>
    /// What a share link says about itself, or <see langword="null"/> when the link is not
    /// readable — an unsupported host, an unreachable page, or no Open Graph tags.
    /// </summary>
    Task<CredentialLink?> ReadAsync(string url, CancellationToken cancellationToken = default);
}

/// <param name="Title">From <c>og:title</c> — the credential's name as the issuer states it.</param>
/// <param name="ImageUrl">From <c>og:image</c> — the badge artwork.</param>
public sealed record CredentialLink(string? Title, string? ImageUrl);
