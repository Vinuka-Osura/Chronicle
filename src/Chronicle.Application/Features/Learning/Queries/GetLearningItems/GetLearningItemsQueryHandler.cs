using Chronicle.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Learning.Queries.GetLearningItems;

public sealed class GetLearningItemsQueryHandler(IChronicleDbContext db)
    : IRequestHandler<GetLearningItemsQuery, IReadOnlyList<LearningItemDto>>
{
    public async Task<IReadOnlyList<LearningItemDto>> Handle(
        GetLearningItemsQuery request,
        CancellationToken cancellationToken)
    {
        return await db.LearningItems
            .AsNoTracking()
            // Hand-ordered in the CMS; recency breaks ties.
            .OrderBy(l => l.SortOrder)
            .ThenByDescending(l => l.UpdatedAt)
            .Select(l => new LearningItemDto(
                l.Topic,
                l.Note,
                l.Status,
                l.ProgressPercent,
                l.Link))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }
}
