using Chronicle.Application.Common.Interfaces;
using Chronicle.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.CareerGraph.Queries.GetCareerGraph;

public sealed record GetCareerGraphQuery : IRequest<CareerGraphDto>;

/// <summary>
/// Projects the whole career into the city's entity vocabulary.
/// </summary>
/// <remarks>
/// <para>
/// The mapping, and why each one is what it is:
/// </para>
/// <list type="bullet">
/// <item><b>Skill → building.</b> A capability that grows in place. Its magnitude is
/// proficiency, and each project or role that used it is an upgrade date, so a building
/// gains storeys as the skill was used rather than being rebuilt.</item>
/// <item><b>Project → road.</b> Work connects capabilities. A road physically joins the
/// buildings whose skills the project used, which is what makes it visible how the
/// pieces worked together instead of being a list.</item>
/// <item><b>Skill category → district.</b> The grouping already exists in the domain;
/// inventing a second one for the city would be two things to keep in step.</item>
/// <item><b>Experience and milestone → landmark.</b> Things that happened once, at a
/// place, rather than capabilities that deepen.</item>
/// <item><b>Roadmap item → speculative entity.</b> Flagged, never hidden. The flag is
/// what lets the city show ambition without claiming it as achievement.</item>
/// </list>
/// <para>
/// No caching concerns here: the endpoint is output-cached and tagged like every other
/// read, and a change to anything dated evicts the whole chronology.
/// </para>
/// </remarks>
public sealed class GetCareerGraphQueryHandler(
    IChronicleDbContext db,
    IDateTimeProvider clock,
    IPublicSiteUrls site)
    : IRequestHandler<GetCareerGraphQuery, CareerGraphDto>
{
    private static readonly IReadOnlyDictionary<string, string> NoMeta =
        new Dictionary<string, string>();

    public async Task<CareerGraphDto> Handle(
        GetCareerGraphQuery request,
        CancellationToken cancellationToken)
    {
        var skills = await db.Skills
            .AsNoTracking()
            .Select(s => new
            {
                s.Id,
                s.Name,
                s.Category,
                s.Proficiency,
                ProjectDates = s.Projects.Select(p => p.StartDate).ToList(),
                RoleDates = s.Experiences.Select(e => e.StartDate).ToList()
            })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var projects = await db.Projects
            .AsNoTracking()
            .Select(p => new
            {
                p.Id,
                p.Title,
                p.Slug,
                p.StartDate,
                p.EndDate,
                p.Featured,
                SkillIds = p.TechStack.Select(s => s.Id).ToList()
            })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var roles = await db.Experiences
            .AsNoTracking()
            .Select(e => new { e.Id, e.Role, e.Company, e.StartDate, e.EndDate })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var milestones = await db.Milestones
            .AsNoTracking()
            .Select(m => new { m.Id, m.Title, m.Date, m.Category, m.Link })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var roadmap = await db.RoadmapItems
            .AsNoTracking()
            .Select(r => new { r.Id, r.Title, r.TargetDate })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var status = await db.SiteStatuses
            .AsNoTracking()
            .Select(s => s.CurrentFocus)
            .FirstOrDefaultAsync(cancellationToken)
            .ConfigureAwait(false);

        var entities = new List<CareerEntityDto>();

        // ---- Districts -----------------------------------------------------
        // Only categories that actually have a skill in them. An empty district is a
        // hole in the map.
        foreach (var category in skills.Select(s => s.Category).Distinct().Order())
        {
            var founded = skills
                .Where(s => s.Category == category)
                .SelectMany(s => s.ProjectDates.Concat(s.RoleDates))
                .DefaultIfEmpty(DateOnly.FromDateTime(clock.UtcNow.UtcDateTime))
                .Min();

            entities.Add(new CareerEntityDto(
                Id: $"district:{category}",
                Kind: "district",
                Label: Humanise(category),
                District: null,
                Built: founded,
                Upgraded: [],
                Retired: null,
                Magnitude: 0,
                Connects: [],
                Speculative: false,
                Href: null,
                Meta: NoMeta));
        }

        // ---- Buildings -----------------------------------------------------
        foreach (var skill in skills)
        {
            var uses = skill.ProjectDates.Concat(skill.RoleDates).Order().ToList();

            // A skill nobody has used yet still exists — it is just a building that went
            // up today rather than one with no birth date at all.
            var built = uses.Count > 0 ? uses[0] : DateOnly.FromDateTime(clock.UtcNow.UtcDateTime);

            entities.Add(new CareerEntityDto(
                Id: $"skill:{skill.Id}",
                Kind: "building",
                Label: skill.Name,
                District: $"district:{skill.Category}",
                Built: built,
                // Every subsequent use is a storey. The first is the construction, not an
                // upgrade, so it is dropped.
                Upgraded: [.. uses.Skip(1).Distinct()],
                Retired: null,
                // 1-5 mapped onto 0-1. Normalised here because only this side knows that
                // 5 is the top of the scale.
                Magnitude: Math.Round(((int)skill.Proficiency - 1) / 4d, 3),
                Connects: [],
                Speculative: false,
                Href: null,
                Meta: NoMeta));
        }

        // ---- Roads ---------------------------------------------------------
        foreach (var project in projects)
        {
            entities.Add(new CareerEntityDto(
                Id: $"project:{project.Id}",
                Kind: "road",
                Label: project.Title,
                District: null,
                Built: project.StartDate,
                Upgraded: [],
                // A finished project is a road that still exists and is still used. The
                // renderer may weather it; it must not remove it.
                Retired: project.EndDate,
                Magnitude: project.Featured ? 1 : 0.6,
                Connects: [.. project.SkillIds.Select(id => $"skill:{id}")],
                Speculative: false,
                // Absolute, because the consumer runs on a different origin and
                // cannot resolve a relative path. Null when the origin is unknown - a
                // link that cannot be resolved is worse than no link.
                Href: site.Absolute($"/projects/{project.Slug}"),
                Meta: NoMeta));
        }

        // ---- Landmarks -----------------------------------------------------
        foreach (var role in roles)
        {
            entities.Add(new CareerEntityDto(
                Id: $"role:{role.Id}",
                Kind: "landmark",
                Label: $"{role.Role}, {role.Company}",
                District: null,
                Built: role.StartDate,
                Upgraded: [],
                Retired: role.EndDate,
                Magnitude: 0.8,
                Connects: [],
                Speculative: false,
                Href: null,
                Meta: NoMeta));
        }

        foreach (var milestone in milestones)
        {
            entities.Add(new CareerEntityDto(
                Id: $"milestone:{milestone.Id}",
                Kind: "landmark",
                Label: milestone.Title,
                District: null,
                Built: milestone.Date,
                Upgraded: [],
                Retired: null,
                Magnitude: milestone.Category == MilestoneCategory.Education ? 0.7 : 0.4,
                Connects: [],
                Speculative: false,
                Href: milestone.Link,
                Meta: NoMeta));
        }

        // ---- Blueprints ----------------------------------------------------
        foreach (var goal in roadmap)
        {
            entities.Add(new CareerEntityDto(
                Id: $"roadmap:{goal.Id}",
                Kind: "building",
                Label: goal.Title,
                District: null,
                Built: goal.TargetDate,
                Upgraded: [],
                Retired: null,
                Magnitude: 0.5,
                Connects: [],
                // The flag the whole "ambitious without being dishonest" property rests
                // on. A consumer that ignores it is misrepresenting someone.
                Speculative: true,
                Href: null,
                Meta: NoMeta));
        }

        return new CareerGraphDto(
            Version: 1,
            GeneratedAt: clock.UtcNow,
            Subject: new CareerSubjectDto("Sam Iversen", status, site.Origin),
            Entities: entities);
    }

    /// <summary>"DevOps" stays "DevOps"; the rest are already readable.</summary>
    private static string Humanise(SkillCategory category) => category switch
    {
        SkillCategory.AI => "AI",
        SkillCategory.DevOps => "DevOps",
        _ => category.ToString()
    };
}
