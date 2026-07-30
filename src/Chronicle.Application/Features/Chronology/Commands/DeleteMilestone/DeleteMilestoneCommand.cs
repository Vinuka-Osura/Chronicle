using Chronicle.Application.Common.Exceptions;
using Chronicle.Application.Common.Interfaces;
using Chronicle.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Chronology.Commands.DeleteMilestone;

public sealed record DeleteMilestoneCommand(Guid Id) : IRequest;

public sealed class DeleteMilestoneCommandHandler(
    IChronicleDbContext db,
    IContentCacheInvalidator cache) : IRequestHandler<DeleteMilestoneCommand>
{
    public async Task Handle(DeleteMilestoneCommand request, CancellationToken cancellationToken)
    {
        var milestone = await db.Milestones
            .FirstOrDefaultAsync(m => m.Id == request.Id, cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Milestone), request.Id);

        db.Milestones.Remove(milestone);
        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        await cache.EvictAsync(cancellationToken, CacheTags.Chronology).ConfigureAwait(false);
    }
}
