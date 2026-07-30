using Chronicle.Application.Common.Exceptions;
using Chronicle.Application.Common.Interfaces;
using Chronicle.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Chronology.Commands.DeleteEra;

public sealed record DeleteEraCommand(Guid Id) : IRequest;

/// <remarks>
/// Nothing holds a foreign key to an era — items are assigned to one by date at read
/// time rather than by a stored reference. Deleting one therefore loses the chapter
/// heading and nothing else: its contents reappear under whichever era now covers those
/// dates, or under none. That is why there is no in-use check here, and why there needs
/// to be one on skills.
/// </remarks>
public sealed class DeleteEraCommandHandler(
    IChronicleDbContext db,
    IContentCacheInvalidator cache) : IRequestHandler<DeleteEraCommand>
{
    public async Task Handle(DeleteEraCommand request, CancellationToken cancellationToken)
    {
        var era = await db.Eras
            .FirstOrDefaultAsync(e => e.Id == request.Id, cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Era), request.Id);

        db.Eras.Remove(era);
        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        await cache.EvictAsync(cancellationToken, CacheTags.Chronology).ConfigureAwait(false);
    }
}
