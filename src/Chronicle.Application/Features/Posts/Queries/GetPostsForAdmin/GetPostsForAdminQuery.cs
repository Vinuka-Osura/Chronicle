using Chronicle.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Posts.Queries.GetPostsForAdmin;

/// <summary>Every article, drafts included, newest first.</summary>
/// <remarks>
/// Separate from <c>GetPostsQuery</c> on purpose. That one filters drafts out in the
/// handler so no caller can forget to; this one must show them, and the two intentions
/// should not share a code path with a boolean between them. This query is never mapped
/// to an endpoint - the admin calls the handler directly, behind Identity.
/// </remarks>
public sealed record GetPostsForAdminQuery : IRequest<IReadOnlyList<AdminPostRow>>;

public sealed record AdminPostRow(
    Guid Id,
    string Title,
    string Slug,
    bool IsPublished,
    DateTimeOffset? PublishedAt,
    DateTimeOffset UpdatedAt,
    int ReadingTimeMinutes,
    IReadOnlyList<string> Tags);

public sealed class GetPostsForAdminQueryHandler(IChronicleDbContext db)
    : IRequestHandler<GetPostsForAdminQuery, IReadOnlyList<AdminPostRow>>
{
    public async Task<IReadOnlyList<AdminPostRow>> Handle(
        GetPostsForAdminQuery request,
        CancellationToken cancellationToken)
    {
        return await db.Posts
            .AsNoTracking()
            // Drafts first: they are the ones needing attention. Then most recently
            // edited, because that is what an operator is usually coming back to.
            .OrderBy(p => p.IsPublished)
            .ThenByDescending(p => p.UpdatedAt)
            .Select(p => new AdminPostRow(
                p.Id,
                p.Title,
                p.Slug,
                p.IsPublished,
                p.PublishedAt,
                p.UpdatedAt,
                p.ReadingTimeMinutes,
                p.Tags.Select(t => t.Name).OrderBy(name => name).ToList()))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }
}
