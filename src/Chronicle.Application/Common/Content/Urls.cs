namespace Chronicle.Application.Common.Content;

/// <summary>
/// The one rule for every operator-supplied link on the site.
/// </summary>
/// <remarks>
/// Absolute and <c>http(s)</c> only, checked in one place because it is a security rule
/// rather than a formatting preference. A relative value resolves against whatever page
/// the visitor happens to be on, and <c>javascript:</c> in an <c>href</c> is stored
/// cross-site scripting with an editor's session behind it.
/// </remarks>
public static class Urls
{
    public static bool IsAbsoluteHttp(string? value) =>
        Uri.TryCreate(value, UriKind.Absolute, out var uri)
        && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
}
