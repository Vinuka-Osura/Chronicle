using Chronicle.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Skills.Queries.GetSkills;

/// <summary>
/// Skills grouped by category, each carrying the work that actually used it.
/// </summary>
/// <remarks>
/// "Used in" is derived from the join tables on every request rather than stored on the
/// skill. That is the whole point of the Skills page: a claim of three years of
/// PostgreSQL is just a number, but a link to the two projects that used it is evidence.
/// Deriving it means the two can never disagree.
/// </remarks>
public sealed class GetSkillsQueryHandler(IChronicleDbContext db)
    : IRequestHandler<GetSkillsQuery, IReadOnlyList<SkillGroupDto>>
{
    public async Task<IReadOnlyList<SkillGroupDto>> Handle(
        GetSkillsQuery request,
        CancellationToken cancellationToken)
    {
        // Projected into an anonymous shape first: the two usage lists come from
        // different joins, and combining them in SQL would not translate. Grouping and
        // concatenation happen in memory, over a set that is a few dozen rows at most.
        var rows = await db.Skills
            .AsNoTracking()
            .OrderBy(s => s.Category)
            .ThenBy(s => s.SortOrder)
            .ThenBy(s => s.Name)
            .Select(s => new
            {
                s.Name,
                s.Category,
                s.YearsExperience,
                s.Proficiency,
                Projects = s.Projects
                    .OrderByDescending(p => p.StartDate)
                    .Select(p => new { p.Title, p.Slug })
                    .ToList(),
                Roles = s.Experiences
                    .OrderByDescending(e => e.StartDate)
                    .Select(e => new { e.Role, e.Company })
                    .ToList(),
            })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return [.. rows
            .Select(s => new SkillDto(
                s.Name,
                s.Category,
                s.YearsExperience,
                s.Proficiency,
                (int)s.Proficiency,
                [
                    .. s.Projects.Select(p => new SkillUsageDto("project", p.Title, p.Slug)),
                    .. s.Roles.Select(r => new SkillUsageDto("experience", $"{r.Role}, {r.Company}", null)),
                ]))
            .GroupBy(s => s.Category)
            .Select(group => new SkillGroupDto(group.Key, [.. group]))];
    }
}
