namespace Chronicle.Application.Common.Interfaces;

/// <summary>
/// Port over full-text article search.
/// </summary>
/// <remarks>
/// <para>
/// A port rather than a LINQ query, because ranked full-text search is a PostgreSQL
/// capability and the expressions that reach it (<c>websearch_to_tsquery</c>,
/// <c>ts_rank</c>) live in the Npgsql provider. Referencing that from Application would
/// bind this layer to one database; putting it behind an interface keeps every
/// Postgres-specific line in Infrastructure, where <c>jsonb</c> and the check constraints
/// already are.
/// </para>
/// <para>
/// Returns ids in rank order rather than whole articles, so the layer that owns the DTO
/// shape keeps owning it.
/// </para>
/// </remarks>
public interface IPostSearch
{
    /// <summary>
    /// Ids of published articles matching <paramref name="term"/>, best match first.
    /// </summary>
    /// <param name="term">
    /// Raw input from a search box. Implementations must treat it as untrusted and must
    /// not throw on nonsense — a stray quote is a typo, not an error worth showing.
    /// </param>
    Task<IReadOnlyList<Guid>> RankAsync(
        string term,
        int limit,
        CancellationToken cancellationToken = default);
}
