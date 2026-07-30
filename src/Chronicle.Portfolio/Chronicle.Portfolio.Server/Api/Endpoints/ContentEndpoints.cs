using Chronicle.Application.Common.Interfaces;
using Chronicle.Application.Features.Certifications;
using Chronicle.Application.Features.Certifications.Queries.GetCertifications;
using Chronicle.Application.Features.Experience;
using Chronicle.Application.Features.Experience.Queries.GetExperience;
using Chronicle.Application.Features.Learning;
using Chronicle.Application.Features.Learning.Queries.GetLearningItems;
using Chronicle.Application.Features.Roadmap;
using Chronicle.Application.Features.Roadmap.Queries.GetRoadmapItems;
using Chronicle.Application.Features.SiteStatus;
using Chronicle.Application.Features.SiteStatus.Queries.GetSiteStatus;
using MediatR;

namespace Chronicle.Portfolio.Server.Api.Endpoints;

/// <summary>
/// The single-resource read endpoints, which are one line of routing each.
/// </summary>
/// <remarks>
/// Grouped into one file rather than five near-identical ones. Each still gets its own
/// cache tag so the CMS can evict precisely what changed; a file per endpoint would add
/// ceremony without adding a seam. Posts and Projects stay separate because they have
/// detail routes and filters worth keeping together.
/// </remarks>
public static class ContentEndpoints
{
    public static IEndpointRouteBuilder MapContentEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/experience", (ISender sender, CancellationToken ct) =>
                sender.Send(new GetExperienceQuery(), ct))
            .WithTags("Experience")
            .WithName("GetExperience")
            .WithSummary("Roles held, most recent first")
            .Produces<IReadOnlyList<ExperienceDto>>()
            .CacheOutput(p => p.Expire(TimeSpan.FromSeconds(60)).Tag(CacheTags.Experience))
            .RequireRateLimiting("api");

        app.MapGet("/api/learning", (ISender sender, CancellationToken ct) =>
                sender.Send(new GetLearningItemsQuery(), ct))
            .WithTags("Learning")
            .WithName("GetLearningItems")
            .WithSummary("What is currently being studied")
            .Produces<IReadOnlyList<LearningItemDto>>()
            .CacheOutput(p => p.Expire(TimeSpan.FromSeconds(60)).Tag(CacheTags.Learning))
            .RequireRateLimiting("api");

        app.MapGet("/api/roadmap", (ISender sender, CancellationToken ct) =>
                sender.Send(new GetRoadmapItemsQuery(), ct))
            .WithTags("Roadmap")
            .WithName("GetRoadmapItems")
            .WithSummary("Stated future goals, soonest first")
            .WithDescription("Rendered below the timeline's today marker. These are intentions, not achievements.")
            .Produces<IReadOnlyList<RoadmapItemDto>>()
            .CacheOutput(p => p.Expire(TimeSpan.FromSeconds(60)).Tag(CacheTags.Roadmap))
            .RequireRateLimiting("api");

        app.MapGet("/api/certifications", (ISender sender, CancellationToken ct) =>
                sender.Send(new GetCertificationsQuery(), ct))
            .WithTags("Certifications")
            .WithName("GetCertifications")
            .WithSummary("Credentials, most recent first")
            .Produces<IReadOnlyList<CertificationDto>>()
            .CacheOutput(p => p.Expire(TimeSpan.FromSeconds(60)).Tag(CacheTags.Certifications))
            .RequireRateLimiting("api");

        app.MapGet("/api/status", (ISender sender, CancellationToken ct) =>
                sender.Send(new GetSiteStatusQuery(), ct))
            .WithTags("Status")
            .WithName("GetSiteStatus")
            .WithSummary("Mission Control status strip")
            .WithDescription("Editorial half comes from the CMS; the last-commit half arrives with the GitHub integration.")
            .Produces<SiteStatusDto>()
            // Shorter TTL than the rest: this is the one surface that claims to be live.
            .CacheOutput(p => p.Expire(TimeSpan.FromSeconds(30)).Tag(CacheTags.Status))
            .RequireRateLimiting("api");

        return app;
    }
}
