using Microsoft.Extensions.Options;

namespace Chronicle.Portfolio.Server.Components;

/// <summary>
/// Builds links from the admin to the public site.
/// </summary>
/// <remarks>
/// The public site is a separate origin - the Next.js client - so the admin cannot form
/// these from its own base address. The origin is already known here as the first
/// allowed CORS origin, which the AppHost sets from the port it assigned the client, so
/// this works in development without anything being hardcoded and in production from
/// configuration.
/// <para>
/// If no origin is configured the link is simply omitted rather than pointing somewhere
/// wrong. A "view on site" button that 404s costs more trust than a missing one.
/// </para>
/// </remarks>
public sealed class PublicSite(IOptions<PublicSiteOptions> options)
{
    private readonly string? _origin = options.Value.Origin?.TrimEnd('/');

    public bool IsKnown => !string.IsNullOrWhiteSpace(_origin);

    public string? Project(string slug) => IsKnown ? $"{_origin}/projects/{slug}" : null;

    public string? Article(string slug) => IsKnown ? $"{_origin}/knowledge/{slug}" : null;

    public string? Home => _origin;
}

public sealed class PublicSiteOptions
{
    public string? Origin { get; set; }
}
