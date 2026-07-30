using Chronicle.Application.Common.Exceptions;
using Chronicle.Application.Common.Interfaces;
using Chronicle.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Posts.Queries.GetPostForEdit;

/// <summary>The editable shape of an article, drafts included.</summary>
public sealed record GetPostForEditQuery(Guid Id) : IRequest<PostEditModel>;

public sealed record PostEditModel(
    Guid Id,
    string Title,
    string Slug,
    string Excerpt,
    string BodyMarkdown,
    bool IsPublished,
    DateTimeOffset? PublishedAt,
    IReadOnlyList<string> Tags);

public sealed class GetPostForEditQueryHandler(IChronicleDbContext db)
    : IRequestHandler<GetPostForEditQuery, PostEditModel>
{
    public async Task<PostEditModel> Handle(
        GetPostForEditQuery request,
        CancellationToken cancellationToken)
    {
        return await db.Posts
            .AsNoTracking()
            .Where(p => p.Id == request.Id)
            .Select(p => new PostEditModel(
                p.Id,
                p.Title,
                p.Slug,
                p.Excerpt,
                p.BodyMarkdown,
                p.IsPublished,
                p.PublishedAt,
                p.Tags.Select(t => t.Name).OrderBy(name => name).ToList()))
            .FirstOrDefaultAsync(cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Post), request.Id);
    }
}
