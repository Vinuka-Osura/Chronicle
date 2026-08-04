using Chronicle.Application.Common.Exceptions;
using Chronicle.Application.Common.Interfaces;
using Chronicle.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Certifications.Commands.DeleteCertification;

public sealed record DeleteCertificationCommand(Guid Id) : IRequest;

/// <remarks>
/// Unlike a skill, a certificate is referenced by nothing else. The join to skills is
/// its own, so removing it takes only those join rows with it and no other page loses
/// anything - which is why this needs no in-use check.
/// </remarks>
public sealed class DeleteCertificationCommandHandler(
    IChronicleDbContext db,
    IContentCacheInvalidator cache) : IRequestHandler<DeleteCertificationCommand>
{
    public async Task Handle(DeleteCertificationCommand request, CancellationToken cancellationToken)
    {
        var certification = await db.Certifications
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Certification), request.Id);

        db.Certifications.Remove(certification);
        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        await cache.EvictAsync(cancellationToken, CacheTags.Certifications, CacheTags.Skills, CacheTags.ExternalStats)
            .ConfigureAwait(false);
    }
}
