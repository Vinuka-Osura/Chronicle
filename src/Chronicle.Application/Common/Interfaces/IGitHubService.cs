using Chronicle.Application.Common.Models;

namespace Chronicle.Application.Common.Interfaces;

/// <summary>
/// Port over the GitHub API. Implemented in Infrastructure with a typed HttpClient
/// and a server-side PAT; the token must never reach the browser.
/// </summary>
public interface IGitHubService
{
    /// <summary>
    /// Returns cached stats, refreshing from GitHub only when the cached row is stale.
    /// Callers get a value even when GitHub is unreachable, so the public site never
    /// blocks on a third party.
    /// </summary>
    Task<GitHubStats> GetStatsAsync(CancellationToken cancellationToken = default);
}
