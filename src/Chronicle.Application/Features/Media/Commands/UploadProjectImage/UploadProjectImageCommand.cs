using Chronicle.Application.Common.Content;
using Chronicle.Application.Common.Exceptions;
using Chronicle.Application.Common.Interfaces;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MediaEntity = Chronicle.Domain.Entities.Media;
using ProjectEntity = Chronicle.Domain.Entities.Project;

namespace Chronicle.Application.Features.Media.Commands.UploadProjectImage;

/// <param name="Content">
/// The uploaded bytes. Must be seekable — the format is read from the first sixteen and
/// then the stream is rewound, because a filename cannot be trusted to say what a file
/// is.
/// </param>
public sealed record UploadProjectImageCommand(
    Guid ProjectId,
    Stream Content,
    string FileName,
    long Length,
    string? Caption) : IRequest<ProjectImageDto>;

public sealed class UploadProjectImageCommandHandler(
    IChronicleDbContext db,
    IMediaStorage storage,
    IContentCacheInvalidator cache) : IRequestHandler<UploadProjectImageCommand, ProjectImageDto>
{
    public async Task<ProjectImageDto> Handle(
        UploadProjectImageCommand request,
        CancellationToken cancellationToken)
    {
        var project = await db.Projects
            .Include(p => p.Screenshots)
            .FirstOrDefaultAsync(p => p.Id == request.ProjectId, cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(ProjectEntity), request.ProjectId);

        var check = ImageValidation.Inspect(request.Content, request.FileName, request.Length);

        if (!check.IsValid)
        {
            throw new ValidationException(
            [
                new ValidationFailure(nameof(UploadProjectImageCommand.Content), check.Error!)
            ]);
        }

        // The content type comes from the bytes, not from what the browser announced, so
        // a mislabelled file cannot survive the round trip and get served back with a
        // type it does not have.
        var stored = await storage
            .UploadAsync(request.Content, request.FileName, check.ContentType!, cancellationToken)
            .ConfigureAwait(false);

        var media = new MediaEntity
        {
            ProjectId = project.Id,
            StorageKey = stored.StorageKey,
            Url = stored.Url,
            ContentType = stored.ContentType,
            SizeBytes = stored.SizeBytes,
            Caption = string.IsNullOrWhiteSpace(request.Caption) ? null : request.Caption.Trim(),
            // Appended, so a new upload never displaces the screenshot the operator
            // deliberately put first.
            SortOrder = project.Screenshots.Count == 0
                ? 0
                : project.Screenshots.Max(s => s.SortOrder) + 1,
            Metadata = new Domain.ValueObjects.MediaMetadata
            {
                OriginalFileName = Path.GetFileName(request.FileName)
            }
        };

        db.Media.Add(media);
        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        await cache.EvictAsync(cancellationToken, CacheTags.Projects).ConfigureAwait(false);

        return new ProjectImageDto(
            media.Id,
            media.Url,
            media.Caption,
            media.SizeBytes,
            media.ContentType,
            media.Metadata.Width,
            media.Metadata.Height,
            media.SortOrder);
    }
}
