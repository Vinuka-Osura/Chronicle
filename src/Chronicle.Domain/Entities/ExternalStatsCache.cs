using Chronicle.Domain.Common;

namespace Chronicle.Domain.Entities;

/// <summary>
/// One cached payload from one external service.
/// </summary>
/// <remarks>
/// <para>
/// Replaces the per-service singleton table. <c>GitHubStatsCache</c> was a single-row table
/// with its own fixed id and its own check constraint, and repeating that shape for Stack
/// Overflow, Credly, Docker Hub and Medium would have meant four more tables, four
/// migrations, eight <c>DbSet</c> declarations and four seeding branches — for four rows.
/// </para>
/// <para>
/// Keyed by <see cref="Provider"/> instead, with a unique index doing the job the check
/// constraint used to: one row per service, enforced by the database rather than trusted.
/// </para>
/// <para>
/// Derives from <see cref="Entity"/> and not <c>AuditableEntity</c> for the same reason
/// its predecessor did: <see cref="FetchedAt"/> means "when we last reached the service",
/// which is a fact about the data rather than an audit trail, and the auditing interceptor
/// must not touch it.
/// </para>
/// </remarks>
public class ExternalStatsCache : Entity
{
    /// <summary>
    /// Lowercase service key — <c>github</c>, <c>stackoverflow</c>, <c>credly</c>,
    /// <c>dockerhub</c>, <c>medium</c>. Unique.
    /// </summary>
    public string Provider { get; set; } = string.Empty;

    /// <summary>
    /// The whole payload as JSON.
    /// </summary>
    /// <remarks>
    /// <c>"{}"</c> means never fetched, and is what a newly seeded row carries. Readers
    /// treat it as absent rather than as an empty result, so the first request refreshes.
    /// </remarks>
    public string PayloadJson { get; set; } = "{}";

    public DateTimeOffset FetchedAt { get; set; }
}
