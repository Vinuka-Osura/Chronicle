using Chronicle.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Timeline.Queries.GetTimeline;

/// <summary>
/// Merges six sources into one chronological stream, assigns each item to an era, and
/// derives the connections between them.
/// </summary>
/// <remarks>
/// This handler loads then composes in memory, which is a deliberate exception to the
/// project-inside-the-query rule. The connection graph needs each item cross-referenced
/// against every other by shared skills and tags; expressing that as SQL would be a pile
/// of correlated subqueries returning less than a few hundred rows. The endpoint is
/// output-cached, so this runs on a cache miss rather than per visitor.
/// </remarks>
public sealed class GetTimelineQueryHandler(IChronicleDbContext db, IDateTimeProvider clock)
    : IRequestHandler<GetTimelineQuery, TimelineResponse>
{
    /// <summary>
    /// Beyond four, a connection list stops being a signpost and becomes a wall of
    /// chips nobody reads.
    /// </summary>
    private const int MaxConnectionsPerItem = 4;

    public async Task<TimelineResponse> Handle(
        GetTimelineQuery request,
        CancellationToken cancellationToken)
    {
        var eras = await db.Eras
            .AsNoTracking()
            .OrderBy(e => e.StartDate)
            .ThenBy(e => e.SortOrder)
            .Select(e => new TimelineEraDto(e.Id, e.Name, e.Tagline, e.StartDate, e.EndDate))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var experiences = await db.Experiences
            .AsNoTracking()
            .Select(e => new
            {
                e.Id,
                e.Role,
                e.Company,
                e.StartDate,
                e.EndDate,
                e.Summary,
                e.Highlights,
                Skills = e.TechStack.Select(s => s.Name).ToList(),
            })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var projects = await db.Projects
            .AsNoTracking()
            .Select(p => new
            {
                p.Title,
                p.Slug,
                p.Pitch,
                p.StartDate,
                p.EndDate,
                Skills = p.TechStack.Select(s => s.Name).ToList(),
                Tags = p.Tags.Select(t => t.Name).ToList(),
                // The card's picture. First by sort order, which is the one the operator
                // deliberately put first rather than whichever row came back first.
                ImageUrl = p.Screenshots
                    .OrderBy(m => m.SortOrder)
                    .Select(m => m.Url)
                    .FirstOrDefault(),
                p.VideoUrl,
            })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var certifications = await db.Certifications
            .AsNoTracking()
            .Select(c => new
            {
                c.Name,
                c.Issuer,
                c.IssueDate,
                c.CredentialUrl,
                Skills = c.Skills.Select(s => s.Name).ToList(),
            })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var milestones = await db.Milestones
            .AsNoTracking()
            .Select(m => new
            {
                m.Title,
                m.Description,
                m.Date,
                m.EndDate,
                m.Category,
                m.Link,
            })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var roadmap = await db.RoadmapItems
            .AsNoTracking()
            .Select(r => new { r.Title, r.Description, r.TargetDate, r.Status })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var posts = await db.Posts
            .AsNoTracking()
            .Where(p => p.IsPublished)
            .Select(p => new { p.Title, p.Slug, Tags = p.Tags.Select(t => t.Name).ToList() })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var items = new List<TimelineItemDto>(
            experiences.Count + projects.Count + certifications.Count +
            milestones.Count + roadmap.Count);

        // How many projects use each skill. Connections name the RAREST shared skill,
        // because that is the one carrying information: "uses Azure" says something,
        // "uses C#" says only that both are .NET work, and every project here is.
        var skillFrequency = projects
            .SelectMany(p => p.Skills)
            .GroupBy(name => name, StringComparer.Ordinal)
            .ToDictionary(g => g.Key, g => g.Count(), StringComparer.Ordinal);

        int Rarity(string skill) => skillFrequency.GetValueOrDefault(skill, 0);

        IEnumerable<string> RarestFirst(IEnumerable<string> skills) =>
            skills.OrderBy(Rarity).ThenBy(s => s, StringComparer.Ordinal);

        // ---- Experience: connects to projects that shared a skill AND overlapped in time.
        // Shared skill alone would link a 2023 role to a 2026 project on the strength of
        // both using C#, which is not a relationship worth showing.
        foreach (var e in experiences)
        {
            var connections = projects
                .Where(p => Overlaps(e.StartDate, e.EndDate, p.StartDate, p.EndDate))
                .Select(p => new
                {
                    p.Title,
                    p.Slug,
                    Shared = p.Skills.Intersect(e.Skills, StringComparer.Ordinal).ToList(),
                })
                .Where(x => x.Shared.Count > 0)
                .OrderByDescending(x => x.Shared.Count)
                .Take(MaxConnectionsPerItem)
                .Select(x => new TimelineConnectionDto(
                    "project", x.Title, x.Slug,
                    $"shared {string.Join(", ", RarestFirst(x.Shared).Take(2))}"))
                .ToList();

            items.Add(new TimelineItemDto(
                "experience", "career", EraFor(eras, e.StartDate), e.StartDate, e.EndDate,
                e.Role, e.Company, e.Summary, null, null, null, null,
                null, null,
                e.Highlights, e.Skills, [], connections));
        }

        // ---- Project: connects to articles sharing a tag.
        foreach (var p in projects)
        {
            var connections = posts
                .Select(post => new
                {
                    post.Title,
                    post.Slug,
                    Shared = post.Tags.Intersect(p.Tags, StringComparer.Ordinal).ToList(),
                })
                .Where(x => x.Shared.Count > 0)
                .OrderByDescending(x => x.Shared.Count)
                .Take(MaxConnectionsPerItem)
                .Select(x => new TimelineConnectionDto(
                    "article", x.Title, x.Slug, $"tagged {x.Shared[0].ToLowerInvariant()}"))
                .ToList();

            items.Add(new TimelineItemDto(
                "project", "career", EraFor(eras, p.StartDate), p.StartDate, p.EndDate,
                p.Title, null, p.Pitch, p.Slug, null, null, null,
                p.ImageUrl, p.VideoUrl,
                [], p.Skills, p.Tags, connections));
        }

        // ---- Certification: certifies a skill, and that skill was used in projects.
        // This is the chain that turns a credential from a dead end into a node with
        // outgoing edges: AZ-204 -> certifies Azure -> used in Chronicle.
        foreach (var c in certifications)
        {
            var connections = RarestFirst(c.Skills)
                .Select(skill => new TimelineConnectionDto("skill", skill, null, "certifies"))
                .Concat(projects
                    .Select(p => new
                    {
                        p.Title,
                        p.Slug,
                        Shared = RarestFirst(p.Skills.Intersect(c.Skills, StringComparer.Ordinal))
                            .ToList(),
                    })
                    .Where(x => x.Shared.Count > 0)
                    // The project sharing this credential's rarest skill first.
                    .OrderBy(x => Rarity(x.Shared[0]))
                    .Select(x => new TimelineConnectionDto(
                        "project", x.Title, x.Slug, $"uses {x.Shared[0]}")))
                .Take(MaxConnectionsPerItem)
                .ToList();

            items.Add(new TimelineItemDto(
                "certification", "life", EraFor(eras, c.IssueDate), c.IssueDate, null,
                c.Name, c.Issuer, null, null, null, null, c.CredentialUrl,
                null, null,
                [], c.Skills, [], connections));
        }

        foreach (var m in milestones)
        {
            items.Add(new TimelineItemDto(
                "milestone", "life", EraFor(eras, m.Date), m.Date, m.EndDate,
                m.Title, null, m.Description, null, null, m.Category.ToString(), m.Link,
                null, null,
                [], [], [], []));
        }

        // Goals take the career track: every one of them is a career goal, and
        // RoadmapItem carries no track of its own.
        foreach (var r in roadmap)
        {
            items.Add(new TimelineItemDto(
                "roadmap", "career", EraFor(eras, r.TargetDate), r.TargetDate, null,
                r.Title, null, r.Description, null, r.Status.ToString(), null, null,
                null, null,
                [], [], [], []));
        }

        return new TimelineResponse(
            clock.Today,
            eras,
            [.. items.OrderBy(i => i.Date).ThenBy(i => i.Title, StringComparer.Ordinal)]);
    }

    /// <summary>
    /// The era covering a date, or null. Null is legitimate — an item outside every era
    /// renders under its year alone rather than disappearing, so a gap in the era list
    /// can never lose content.
    /// </summary>
    private static Guid? EraFor(IReadOnlyList<TimelineEraDto> eras, DateOnly date)
    {
        // Last match wins, so the later of two overlapping eras takes the item. Eras are
        // ordered by start date, and an open-ended one should not swallow everything
        // after it.
        Guid? found = null;

        foreach (var era in eras)
        {
            if (date >= era.StartDate && (era.EndDate is null || date <= era.EndDate))
            {
                found = era.Id;
            }
        }

        return found;
    }

    /// <summary>Whether two date ranges overlap. A null end date means "still running".</summary>
    private static bool Overlaps(DateOnly aStart, DateOnly? aEnd, DateOnly bStart, DateOnly? bEnd) =>
        aStart <= (bEnd ?? DateOnly.MaxValue) && bStart <= (aEnd ?? DateOnly.MaxValue);
}
