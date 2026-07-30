using Chronicle.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Roadmap.Queries.GetRoadmapItems;

public sealed class GetRoadmapItemsQueryHandler(IChronicleDbContext db)
    : IRequestHandler<GetRoadmapItemsQuery, IReadOnlyList<RoadmapItemDto>>
{
    public async Task<IReadOnlyList<RoadmapItemDto>> Handle(
        GetRoadmapItemsQuery request,
        CancellationToken cancellationToken)
    {
        return await db.RoadmapItems
            .AsNoTracking()
            // Soonest first — the same direction the timeline reads.
            .OrderBy(r => r.TargetDate)
            .ThenBy(r => r.SortOrder)
            .Select(r => new RoadmapItemDto(
                r.Title,
                r.Description,
                r.TargetDate,
                r.Status))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }
}
