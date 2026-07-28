using Chronicle.Domain.Common;

namespace Chronicle.Domain.Entities;

/// <summary>
/// Server-side cache of the GitHub API response backing the Analytics page and the
/// live half of the Mission Control strip.
/// </summary>
/// <remarks>
/// Single-row table, overwritten on refresh. It exists so the public site never blocks
/// on GitHub, never burns rate limit per visitor, and never needs the PAT in a browser.
/// Deliberately not an <c>AuditableEntity</c>: <see cref="FetchedAt"/> means "when we
/// last called GitHub", which is a domain fact, not an audit timestamp.
/// </remarks>
public class GitHubStatsCache : Entity
{
    /// <summary>Fixed primary key for the one and only row.</summary>
    public static readonly Guid SingletonId = new("0195c0de-0000-7000-8000-000000000002");

    /// <summary>Raw shaped payload, stored as jsonb.</summary>
    public string PayloadJson { get; set; } = "{}";

    public DateTimeOffset FetchedAt { get; set; }
}
