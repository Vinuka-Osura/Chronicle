using Chronicle.Application.Common.Interfaces;
using Chronicle.Application.Features.Analytics;
using Chronicle.Application.Features.CareerGraph;
using Chronicle.Application.Features.CareerGraph.Queries.GetCareerGraph;
using Chronicle.Application.Features.Analytics.Queries.GetGitHubStats;
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
            .WithDescription("Editorial half comes from the CMS; the last-commit half from the cached GitHub payload.")
            .Produces<SiteStatusDto>()
            // Shorter TTL than the rest: this is the one surface that claims to be live.
            .CacheOutput(p => p.Expire(TimeSpan.FromSeconds(30)).Tag(CacheTags.Status))
            .RequireRateLimiting("api");

        app.MapGet("/api/career-graph", (ISender sender, CancellationToken ct) =>
                sender.Send(new GetCareerGraphQuery(), ct))
            .WithTags("Career graph")
            .WithName("GetCareerGraph")
            .WithSummary("The career as timestamped entities, for the Software City renderer")
            .WithDescription(
                "Conforms to contracts/career-graph.v1.schema.json, which is CC0 and versioned. " +
                "This endpoint is one producer of that shape and has no special status: anything " +
                "emitting the same document can drive the same renderer. The schema is the " +
                "contract, not this endpoint.")
            .Produces<CareerGraphDto>()
            .CacheOutput(p => p.Expire(TimeSpan.FromSeconds(60)).Tag(CacheTags.CareerGraph))
            .RequireRateLimiting("api");

        app.MapGet("/api/github/stats", (ISender sender, CancellationToken ct) =>
                sender.Send(new GetGitHubStatsQuery(), ct))
            .WithTags("Analytics")
            .WithName("GetGitHubStats")
            .WithSummary("Contribution calendar, language mix and streaks")
            .WithDescription(
                "Served from a server-side cache refreshed at most every few hours, never from a " +
                "per-visitor call to GitHub. Returns IsLive=false rather than an error when GitHub " +
                "has never been reached.")
            .Produces<GitHubStatsDto>()
            // Long TTL on purpose: the payload behind it only changes a few times a day,
            // and the numbers do not claim to be to-the-minute.
            .CacheOutput(p => p.Expire(TimeSpan.FromMinutes(10)).Tag(CacheTags.GitHubStats))
            .RequireRateLimiting("api");

        return app;
    }
}
