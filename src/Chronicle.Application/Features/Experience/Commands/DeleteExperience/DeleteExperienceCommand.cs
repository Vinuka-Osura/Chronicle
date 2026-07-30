using Chronicle.Application.Common.Exceptions;
using Chronicle.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ExperienceEntity = Chronicle.Domain.Entities.Experience;

namespace Chronicle.Application.Features.Experience.Commands.DeleteExperience;

public sealed record DeleteExperienceCommand(Guid Id) : IRequest;

public sealed class DeleteExperienceCommandHandler(
    IChronicleDbContext db,
    IContentCacheInvalidator cache) : IRequestHandler<DeleteExperienceCommand>
{
    public async Task Handle(DeleteExperienceCommand request, CancellationToken cancellationToken)
    {
        var role = await db.Experiences
            .FirstOrDefaultAsync(e => e.Id == request.Id, cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(ExperienceEntity), request.Id);

        db.Experiences.Remove(role);
        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        await cache.EvictAsync(
                cancellationToken,
                [CacheTags.Experience, CacheTags.Skills, .. CacheTags.Chronology])
            .ConfigureAwait(false);
    }
}
