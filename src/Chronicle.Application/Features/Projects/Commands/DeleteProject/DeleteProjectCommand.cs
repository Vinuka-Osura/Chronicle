using Chronicle.Application.Common.Exceptions;
using Chronicle.Application.Common.Interfaces;
using Chronicle.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Projects.Commands.DeleteProject;

public sealed record DeleteProjectCommand(Guid Id) : IRequest;

public sealed class DeleteProjectCommandHandler(
    IChronicleDbContext db,
    IContentCacheInvalidator cache) : IRequestHandler<DeleteProjectCommand>
{
    public async Task Handle(DeleteProjectCommand request, CancellationToken cancellationToken)
    {
        var project = await db.Projects
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Project), request.Id);

        db.Projects.Remove(project);
        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        await cache.EvictAsync(
                cancellationToken,
                [CacheTags.Projects, CacheTags.Skills, .. CacheTags.Chronology])
            .ConfigureAwait(false);
    }
}
