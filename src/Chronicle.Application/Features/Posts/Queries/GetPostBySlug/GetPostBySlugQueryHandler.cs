using Chronicle.Application.Common.Exceptions;
using Chronicle.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Posts.Queries.GetPostBySlug;

public sealed class GetPostBySlugQueryHandler(IChronicleDbContext db)
    : IRequestHandler<GetPostBySlugQuery, PostDetailDto>
{
    public async Task<PostDetailDto> Handle(
        GetPostBySlugQuery request,
        CancellationToken cancellationToken)
    {
        var post = await db.Posts
            .AsNoTracking()
            // An unpublished post is a 404, not a 403: the public API should not confirm
            // that a draft exists at a given slug.
            .Where(p => p.IsPublished && p.Slug == request.Slug)
            .Select(p => new PostDetailDto(
                p.Slug,
                p.Title,
                p.Excerpt,
                p.BodyMarkdown,
                p.ReadingTimeMinutes,
                p.PublishedAt,
                p.Tags.OrderBy(t => t.Name).Select(t => t.Name).ToList()))
            .FirstOrDefaultAsync(cancellationToken)
            .ConfigureAwait(false);

        return post ?? throw new NotFoundException("Post", request.Slug);
    }
}
