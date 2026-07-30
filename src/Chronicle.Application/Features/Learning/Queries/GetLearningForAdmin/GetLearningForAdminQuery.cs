using Chronicle.Application.Common.Interfaces;
using Chronicle.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Learning.Queries.GetLearningForAdmin;

public sealed record GetLearningForAdminQuery : IRequest<IReadOnlyList<AdminLearningRow>>;

public sealed record AdminLearningRow(
    Guid Id,
    string Topic,
    string Note,
    LearningStatus Status,
    int? ProgressPercent,
    string? Link,
    int SortOrder);

public sealed class GetLearningForAdminQueryHandler(IChronicleDbContext db)
    : IRequestHandler<GetLearningForAdminQuery, IReadOnlyList<AdminLearningRow>>
{
    public async Task<IReadOnlyList<AdminLearningRow>> Handle(
        GetLearningForAdminQuery request,
        CancellationToken cancellationToken)
    {
        return await db.LearningItems
            .AsNoTracking()
            .OrderBy(l => l.SortOrder)
            .ThenBy(l => l.Topic)
            .Select(l => new AdminLearningRow(
                l.Id, l.Topic, l.Note, l.Status, l.ProgressPercent, l.Link, l.SortOrder))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }
}
