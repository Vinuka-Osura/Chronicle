namespace Chronicle.Infrastructure.Services;

/// <summary>
/// Binds the <c>GitHub</c> configuration section.
/// </summary>
/// <remarks>
/// The username is public and lives in <c>appsettings.json</c>. The PAT never does -
/// this repository is public, so it goes in user-secrets locally and a deployment
/// secret in production.
/// </remarks>
public sealed class GitHubOptions
{
    public const string SectionName = "GitHub";

    public string Username { get; set; } = string.Empty;

    /// <summary>
    /// Fine-grained token with public read access only. It buys the contribution
    /// calendar - which GitHub exposes solely through the authenticated GraphQL API -
    /// and lifts the REST rate limit from 60 requests an hour to 5,000.
    /// </summary>
    public string Pat { get; set; } = string.Empty;

    /// <summary>How long a cached payload is considered current.</summary>
    /// <remarks>
    /// Six hours. A contribution graph that lags by a morning is indistinguishable from
    /// a live one to a reader, and this keeps the site to four calls a day against a
    /// limit of sixty an hour even with no token at all.
    /// </remarks>
    public TimeSpan RefreshInterval { get; set; } = TimeSpan.FromHours(6);

    /// <summary>
    /// How many repositories to ask for a language byte breakdown, most recently
    /// pushed first. One request each, so this is the knob that decides the cost of a
    /// refresh.
    /// </summary>
    public int LanguageRepoLimit { get; set; } = 12;

    /// <summary>Without a username there is nothing to query, and the page says so.</summary>
    public bool IsConfigured => !string.IsNullOrWhiteSpace(Username);

    /// <summary>GitHub's GraphQL API rejects anonymous requests outright.</summary>
    public bool CanQueryGraphQl => IsConfigured && !string.IsNullOrWhiteSpace(Pat);
}
