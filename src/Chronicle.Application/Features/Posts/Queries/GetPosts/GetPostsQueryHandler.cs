using Chronicle.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Posts.Queries.GetPosts;

public sealed class GetPostsQueryHandler(IChronicleDbContext db)
    : IRequestHandler<GetPostsQuery, IReadOnlyList<PostCardDto>>
{
    public async Task<IReadOnlyList<PostCardDto>> Handle(
        GetPostsQuery request,
        CancellationToken cancellationToken)
    {
        // Unpublished drafts must never reach the public API. This filter is applied
        // here rather than left to the caller precisely so it cannot be forgotten.
        var query = db.Posts.AsNoTracking().Where(p => p.IsPublished);

        if (!string.IsNullOrWhiteSpace(request.Tag))
        {
            query = query.Where(p => p.Tags.Any(t => t.Slug == request.Tag));
        }

        return await query
            .OrderByDescending(p => p.PublishedAt)
            .Select(p => new PostCardDto(
                p.Slug,
                p.Title,
                p.Excerpt,
                p.ReadingTimeMinutes,
                p.PublishedAt,
                p.Tags.OrderBy(t => t.Name).Select(t => t.Name).ToList(),
                p.ExternalUrl,
                p.CoverImageUrl))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }
}
