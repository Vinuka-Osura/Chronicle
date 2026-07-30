using Chronicle.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Experience.Queries.GetExperience;

public sealed class GetExperienceQueryHandler(IChronicleDbContext db)
    : IRequestHandler<GetExperienceQuery, IReadOnlyList<ExperienceDto>>
{
    public async Task<IReadOnlyList<ExperienceDto>> Handle(
        GetExperienceQuery request,
        CancellationToken cancellationToken)
    {
        return await db.Experiences
            .AsNoTracking()
            // Most recent first: a résumé reads backwards.
            .OrderByDescending(e => e.StartDate)
            .ThenBy(e => e.SortOrder)
            .Select(e => new ExperienceDto(
                e.Id,
                e.Role,
                e.Company,
                e.StartDate,
                e.EndDate,
                e.Summary,
                e.Highlights,
                e.TechStack.OrderBy(s => s.SortOrder).Select(s => s.Name).ToList()))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }
}
