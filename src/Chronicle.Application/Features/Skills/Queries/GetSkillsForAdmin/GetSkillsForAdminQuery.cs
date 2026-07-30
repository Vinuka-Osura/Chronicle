using Chronicle.Application.Common.Interfaces;
using Chronicle.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Skills.Queries.GetSkillsForAdmin;

/// <summary>
/// Every skill as a flat editable list.
/// </summary>
/// <remarks>
/// The public query groups by category and derives a "used in" list; this one is the
/// rows as they are stored, plus how many things reference each — which is what tells
/// the operator whether a skill can be deleted before they try.
/// </remarks>
public sealed record GetSkillsForAdminQuery : IRequest<IReadOnlyList<AdminSkillRow>>;

public sealed record AdminSkillRow(
    Guid Id,
    string Name,
    SkillCategory Category,
    decimal YearsExperience,
    ProficiencyLevel Proficiency,
    int SortOrder,
    int UsageCount);

public sealed class GetSkillsForAdminQueryHandler(IChronicleDbContext db)
    : IRequestHandler<GetSkillsForAdminQuery, IReadOnlyList<AdminSkillRow>>
{
    public async Task<IReadOnlyList<AdminSkillRow>> Handle(
        GetSkillsForAdminQuery request,
        CancellationToken cancellationToken)
    {
        return await db.Skills
            .AsNoTracking()
            .OrderBy(s => s.Category)
            .ThenBy(s => s.SortOrder)
            .ThenBy(s => s.Name)
            .Select(s => new AdminSkillRow(
                s.Id,
                s.Name,
                s.Category,
                s.YearsExperience,
                s.Proficiency,
                s.SortOrder,
                s.Projects.Count + s.Experiences.Count + s.Certifications.Count))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }
}
