using Chronicle.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Experience.Queries.GetExperienceForAdmin;

/// <summary>Roles as stored, most recent first.</summary>
public sealed record GetExperienceForAdminQuery : IRequest<IReadOnlyList<AdminExperienceRow>>;

public sealed record AdminExperienceRow(
    Guid Id,
    string Role,
    string Company,
    DateOnly StartDate,
    DateOnly? EndDate,
    string Summary,
    IReadOnlyList<string> Highlights,
    IReadOnlyList<string> TechStack,
    int SortOrder);

public sealed class GetExperienceForAdminQueryHandler(IChronicleDbContext db)
    : IRequestHandler<GetExperienceForAdminQuery, IReadOnlyList<AdminExperienceRow>>
{
    public async Task<IReadOnlyList<AdminExperienceRow>> Handle(
        GetExperienceForAdminQuery request,
        CancellationToken cancellationToken)
    {
        return await db.Experiences
            .AsNoTracking()
            .OrderBy(e => e.SortOrder)
            .ThenByDescending(e => e.StartDate)
            .Select(e => new AdminExperienceRow(
                e.Id,
                e.Role,
                e.Company,
                e.StartDate,
                e.EndDate,
                e.Summary,
                e.Highlights,
                e.TechStack.Select(s => s.Name).OrderBy(name => name).ToList(),
                e.SortOrder))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }
}
