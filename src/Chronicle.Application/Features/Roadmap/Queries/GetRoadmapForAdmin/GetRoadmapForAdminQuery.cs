using Chronicle.Application.Common.Interfaces;
using Chronicle.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Roadmap.Queries.GetRoadmapForAdmin;

public sealed record GetRoadmapForAdminQuery : IRequest<IReadOnlyList<AdminRoadmapRow>>;

public sealed record AdminRoadmapRow(
    Guid Id,
    string Title,
    string Description,
    DateOnly TargetDate,
    RoadmapStatus Status,
    int SortOrder);

public sealed class GetRoadmapForAdminQueryHandler(IChronicleDbContext db)
    : IRequestHandler<GetRoadmapForAdminQuery, IReadOnlyList<AdminRoadmapRow>>
{
    public async Task<IReadOnlyList<AdminRoadmapRow>> Handle(
        GetRoadmapForAdminQuery request,
        CancellationToken cancellationToken)
    {
        return await db.RoadmapItems
            .AsNoTracking()
            .OrderBy(r => r.SortOrder)
            .ThenBy(r => r.TargetDate)
            .Select(r => new AdminRoadmapRow(
                r.Id, r.Title, r.Description, r.TargetDate, r.Status, r.SortOrder))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }
}
