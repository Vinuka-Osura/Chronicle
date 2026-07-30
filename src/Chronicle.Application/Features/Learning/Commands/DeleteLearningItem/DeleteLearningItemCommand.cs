using Chronicle.Application.Common.Exceptions;
using Chronicle.Application.Common.Interfaces;
using Chronicle.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Learning.Commands.DeleteLearningItem;

public sealed record DeleteLearningItemCommand(Guid Id) : IRequest;

public sealed class DeleteLearningItemCommandHandler(
    IChronicleDbContext db,
    IContentCacheInvalidator cache) : IRequestHandler<DeleteLearningItemCommand>
{
    public async Task Handle(DeleteLearningItemCommand request, CancellationToken cancellationToken)
    {
        var item = await db.LearningItems
            .FirstOrDefaultAsync(l => l.Id == request.Id, cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(LearningItem), request.Id);

        db.LearningItems.Remove(item);
        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        await cache.EvictAsync(cancellationToken, CacheTags.Learning).ConfigureAwait(false);
    }
}
