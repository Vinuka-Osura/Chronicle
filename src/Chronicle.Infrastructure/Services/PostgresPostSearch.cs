using Chronicle.Application.Common.Interfaces;
using Chronicle.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Infrastructure.Services;

/// <summary>
/// Ranked full-text search over articles, using the stored <c>SearchVector</c> column.
/// </summary>
/// <remarks>
/// <para>
/// <b>websearch_to_tsquery, not to_tsquery.</b> The latter throws on anything that is not
/// valid tsquery syntax — an unbalanced quote, a stray ampersand, the word "and" — which
/// would turn ordinary typing in a search box into a 500. websearch_to_tsquery parses the
/// syntax people already know from search engines (quoted phrases, <c>OR</c>, a leading
/// <c>-</c> to exclude) and never fails on input it does not understand.
/// </para>
/// <para>
/// The vector is a stored generated column, so matching reads an index rather than
/// re-parsing every article body on every keystroke, and it can never fall out of step
/// with the text it came from — PostgreSQL recomputes it as part of the write.
/// </para>
/// </remarks>
public sealed class PostgresPostSearch(ChronicleDbContext db) : IPostSearch
{
    public async Task<IReadOnlyList<Guid>> RankAsync(
        string term,
        int limit,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(term))
        {
            return [];
        }

        // Interpolated into FormattableString, which EF turns into bound parameters -
        // the term is untrusted input and never reaches the server as SQL text.
        return await db.Database
            .SqlQuery<Guid>(
                $"""
                SELECT p."Id"
                FROM knowledge_posts AS p
                WHERE p."IsPublished"
                  AND p."SearchVector" @@ websearch_to_tsquery('english', {term})
                ORDER BY ts_rank(p."SearchVector", websearch_to_tsquery('english', {term})) DESC,
                         p."PublishedAt" DESC NULLS LAST
                LIMIT {limit}
                """)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }
}
