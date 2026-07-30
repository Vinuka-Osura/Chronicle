using Chronicle.Application.Common.Exceptions;
using Chronicle.Application.Common.Interfaces;
using Chronicle.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Posts.Commands.DeletePost;

public sealed record DeletePostCommand(Guid Id) : IRequest;

/// <remarks>
/// A hard delete. There is no soft-delete flag anywhere in this schema and adding one
/// for a single entity would mean every read remembering to filter on it - the failure
/// mode being a draft that quietly stays public. Unpublishing is the reversible action;
/// deleting is meant to be final.
/// </remarks>
public sealed class DeletePostCommandHandler(
    IChronicleDbContext db,
    IContentCacheInvalidator cache) : IRequestHandler<DeletePostCommand>
{
    public async Task Handle(DeletePostCommand request, CancellationToken cancellationToken)
    {
        var post = await db.Posts
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Post), request.Id);

        db.Posts.Remove(post);
        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        await cache.EvictAsync(cancellationToken, [CacheTags.Posts, .. CacheTags.Chronology])
            .ConfigureAwait(false);
    }
}
