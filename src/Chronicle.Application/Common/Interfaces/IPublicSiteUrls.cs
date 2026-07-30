namespace Chronicle.Application.Common.Interfaces;

/// <summary>
/// Where the public site lives, for the rare case something has to emit an absolute URL.
/// </summary>
/// <remarks>
/// Almost nothing needs this: the site's own pages link relatively, which is correct and
/// survives a domain change. The career graph is the exception, and the reason is the
/// whole point of that contract — it is consumed by a <b>separate product</b> running on
/// a different origin, which cannot resolve <c>/projects/ledger</c> against anything.
/// A contract that requires the consumer to know the producer's address is not a
/// contract between independent systems.
/// </remarks>
public interface IPublicSiteUrls
{
    /// <summary>
    /// The public site's origin, without a trailing slash, or null when it is not
    /// configured — in development, typically.
    /// </summary>
    string? Origin { get; }

    /// <summary>
    /// Turns a site-relative path into an absolute URL, or returns null when the origin
    /// is unknown.
    /// </summary>
    /// <remarks>
    /// Null rather than the relative path, deliberately. A consumer receiving no link can
    /// render an entity without one; a consumer receiving a link it cannot resolve
    /// renders a broken one, and blames the wrong system for it.
    /// </remarks>
    string? Absolute(string relativePath);
}
