using Chronicle.Application.Common.Exceptions;
using Chronicle.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MediaEntity = Chronicle.Domain.Entities.Media;

namespace Chronicle.Application.Features.Media.Commands.DeleteProjectImage;

public sealed record DeleteProjectImageCommand(Guid Id) : IRequest;

public sealed class DeleteProjectImageCommandHandler(
    IChronicleDbContext db,
    IMediaStorage storage,
    IContentCacheInvalidator cache) : IRequestHandler<DeleteProjectImageCommand>
{
    /// <summary>
    /// Marks a row whose image lives somewhere this application does not control - a
    /// hotlinked URL, or seed data written before object storage existed. Removing the
    /// row is all there is to do; there is no object of ours to delete.
    /// </summary>
    public const string ExternalKeyPrefix = "external:";

    public async Task Handle(DeleteProjectImageCommand request, CancellationToken cancellationToken)
    {
        var media = await db.Media
            .FirstOrDefaultAsync(m => m.Id == request.Id, cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(MediaEntity), request.Id);

        /*
          Object first, row second.

          Either order can fail halfway, so the question is which orphan is worse. A file
          with no row is invisible, costs a few kilobytes, and shows up in the storage
          gauge as a discrepancy. A row with no file is a broken image on a public case
          study - visible to exactly the person the site exists to impress.

          So: delete the object, and only record the deletion once that succeeded. If the
          delete throws, the row stays and the operator can try again.
        */
        if (!media.StorageKey.StartsWith(ExternalKeyPrefix, StringComparison.Ordinal))
        {
            await storage.DeleteAsync(media.StorageKey, cancellationToken).ConfigureAwait(false);
        }

        db.Media.Remove(media);
        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        await cache.EvictAsync(cancellationToken, CacheTags.Projects).ConfigureAwait(false);
    }
}
