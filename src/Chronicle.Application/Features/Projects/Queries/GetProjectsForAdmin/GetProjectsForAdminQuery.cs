using Chronicle.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Projects.Queries.GetProjectsForAdmin;

/// <summary>Every project in editing order, with enough to identify one at a glance.</summary>
public sealed record GetProjectsForAdminQuery : IRequest<IReadOnlyList<AdminProjectRow>>;

public sealed record AdminProjectRow(
    Guid Id,
    string Title,
    string Slug,
    bool Featured,
    int SortOrder,
    DateOnly StartDate,
    DateOnly? EndDate,
    DateTimeOffset UpdatedAt,
    int TagCount,
    int SkillCount);

public sealed class GetProjectsForAdminQueryHandler(IChronicleDbContext db)
    : IRequestHandler<GetProjectsForAdminQuery, IReadOnlyList<AdminProjectRow>>
{
    public async Task<IReadOnlyList<AdminProjectRow>> Handle(
        GetProjectsForAdminQuery request,
        CancellationToken cancellationToken)
    {
        return await db.Projects
            .AsNoTracking()
            // The same order the public page uses, so what the operator drags into place
            // here is what a visitor sees rather than something they have to go and check.
            .OrderByDescending(p => p.Featured)
            .ThenBy(p => p.SortOrder)
            .ThenByDescending(p => p.StartDate)
            .Select(p => new AdminProjectRow(
                p.Id,
                p.Title,
                p.Slug,
                p.Featured,
                p.SortOrder,
                p.StartDate,
                p.EndDate,
                p.UpdatedAt,
                p.Tags.Count,
                p.TechStack.Count))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }
}
