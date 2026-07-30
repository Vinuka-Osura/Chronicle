using Chronicle.Application.Common.Exceptions;
using Chronicle.Application.Common.Interfaces;
using Chronicle.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Roadmap.Commands.DeleteRoadmapItem;

public sealed record DeleteRoadmapItemCommand(Guid Id) : IRequest;

public sealed class DeleteRoadmapItemCommandHandler(
    IChronicleDbContext db,
    IContentCacheInvalidator cache) : IRequestHandler<DeleteRoadmapItemCommand>
{
    public async Task Handle(DeleteRoadmapItemCommand request, CancellationToken cancellationToken)
    {
        var item = await db.RoadmapItems
            .FirstOrDefaultAsync(r => r.Id == request.Id, cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(RoadmapItem), request.Id);

        db.RoadmapItems.Remove(item);
        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        await cache.EvictAsync(cancellationToken, [CacheTags.Roadmap, .. CacheTags.Chronology])
            .ConfigureAwait(false);
    }
}
