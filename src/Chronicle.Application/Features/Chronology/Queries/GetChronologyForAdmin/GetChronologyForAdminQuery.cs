using Chronicle.Application.Common.Interfaces;
using Chronicle.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Chronology.Queries.GetChronologyForAdmin;

/// <summary>
/// Eras and milestones together, in one round trip.
/// </summary>
/// <remarks>
/// One query rather than two because they are edited on the same screen and only make
/// sense together: a milestone is hard to place until you can see which era it falls in.
/// Two queries would be two trips to answer one question.
/// </remarks>
public sealed record GetChronologyForAdminQuery : IRequest<AdminChronology>;

public sealed record AdminChronology(
    IReadOnlyList<AdminEraRow> Eras,
    IReadOnlyList<AdminMilestoneRow> Milestones);

public sealed record AdminEraRow(
    Guid Id,
    string Name,
    string? Tagline,
    DateOnly StartDate,
    DateOnly? EndDate,
    int SortOrder);

public sealed record AdminMilestoneRow(
    Guid Id,
    string Title,
    string Description,
    DateOnly Date,
    DateOnly? EndDate,
    MilestoneCategory Category,
    string? Link,
    int SortOrder);

public sealed class GetChronologyForAdminQueryHandler(IChronicleDbContext db)
    : IRequestHandler<GetChronologyForAdminQuery, AdminChronology>
{
    public async Task<AdminChronology> Handle(
        GetChronologyForAdminQuery request,
        CancellationToken cancellationToken)
    {
        var eras = await db.Eras
            .AsNoTracking()
            .OrderBy(e => e.SortOrder)
            .ThenBy(e => e.StartDate)
            .Select(e => new AdminEraRow(e.Id, e.Name, e.Tagline, e.StartDate, e.EndDate, e.SortOrder))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var milestones = await db.Milestones
            .AsNoTracking()
            .OrderByDescending(m => m.Date)
            .Select(m => new AdminMilestoneRow(
                m.Id, m.Title, m.Description, m.Date, m.EndDate, m.Category, m.Link, m.SortOrder))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return new AdminChronology(eras, milestones);
    }
}
