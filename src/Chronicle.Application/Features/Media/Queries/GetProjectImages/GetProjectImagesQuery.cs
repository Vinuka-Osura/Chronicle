using Chronicle.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Media.Queries.GetProjectImages;

public sealed record GetProjectImagesQuery(Guid ProjectId) : IRequest<IReadOnlyList<ProjectImageDto>>;

public sealed class GetProjectImagesQueryHandler(IChronicleDbContext db)
    : IRequestHandler<GetProjectImagesQuery, IReadOnlyList<ProjectImageDto>>
{
    public async Task<IReadOnlyList<ProjectImageDto>> Handle(
        GetProjectImagesQuery request,
        CancellationToken cancellationToken)
    {
        return await db.Media
            .AsNoTracking()
            .Where(m => m.ProjectId == request.ProjectId)
            .OrderBy(m => m.SortOrder)
            .Select(m => new ProjectImageDto(
                m.Id,
                m.Url,
                m.Caption,
                m.SizeBytes,
                m.ContentType,
                m.Metadata.Width,
                m.Metadata.Height,
                m.SortOrder))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }
}
