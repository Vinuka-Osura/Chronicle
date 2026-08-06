using Chronicle.Application.Common.Interfaces;
using Chronicle.Application.Features.Analytics;
using Chronicle.Application.Features.Ask;
using Chronicle.Application.Features.Ask.Queries.Ask;
using Chronicle.Application.Features.CareerGraph;
using Chronicle.Application.Features.CareerGraph.Queries.GetCareerGraph;
using Chronicle.Application.Features.Analytics.Queries.GetGitHubStats;
using Chronicle.Application.Features.Analytics.Queries.GetExternalStats;
using Chronicle.Application.Features.Certifications;
using Chronicle.Application.Features.Certifications.Queries.GetCertifications;
using Chronicle.Application.Features.Experience;
using Chronicle.Application.Features.Experience.Queries.GetExperience;
using Chronicle.Application.Features.Learning;
using Chronicle.Application.Features.Learning.Queries.GetLearningItems;
using Chronicle.Application.Features.Profile;
using Chronicle.Application.Features.Profile.Queries.GetProfile;
using Chronicle.Application.Features.Resumes;
using Chronicle.Application.Features.Resumes.Queries.GetResume;
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
    /// <summary>
    /// Everything the résumé is assembled from, so any CMS edit that changes the CV
    /// evicts it.
    /// </summary>
    /// <remarks>
    /// <see cref="CacheTags.Timeline"/> is in the list because education comes from
    /// milestones, and editing a milestone evicts the chronology tags rather than a tag
    /// of its own. Miss it and a new degree appears everywhere except the CV.
    /// </remarks>
    private static readonly string[] ResumeTags =
    [
        CacheTags.Profile,
        CacheTags.Experience,
        CacheTags.Projects,
        CacheTags.Skills,
        CacheTags.Certifications,
        CacheTags.Timeline,
    ];

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

        app.MapGet("/api/profile", (ISender sender, CancellationToken ct) =>
                sender.Send(new GetProfileQuery(), ct))
            .WithTags("Profile")
            .WithName("GetProfile")
            .WithSummary("Name, contact details and professional summary")
            .WithDescription(
                "Null until the profile is filled in, rather than a placeholder person. Every " +
                "field on it is a claim about someone real, so an unset profile is an absent " +
                "one.")
            .Produces<ProfileDto>()
            .CacheOutput(p => p.Expire(TimeSpan.FromSeconds(60)).Tag(CacheTags.Profile))
            .RequireRateLimiting("api");

        app.MapGet("/api/resume", (ISender sender, CancellationToken ct) =>
                sender.Send(new GetResumeQuery(), ct))
            .WithTags("Resume")
            .WithName("GetResume")
            .WithSummary("The whole CV, assembled from the content the site already serves")
            .WithDescription(
                "A projection rather than a stored document, so it cannot disagree with the " +
                "pages it is built from.")
            .Produces<ResumeDto>()
            .CacheOutput(p => p.Expire(TimeSpan.FromSeconds(60)).Tag(ResumeTags))
            .RequireRateLimiting("api");

        app.MapGet("/api/resume.docx", async (ISender sender, CancellationToken ct) =>
            {
                var resume = await sender.Send(new GetResumeQuery(), ct);

                return Results.File(
                    WordResume.Build(resume),
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    WordResume.FileName(resume));
            })
            .WithTags("Resume")
            .WithName("GetResumeDocx")
            .WithSummary("The same CV as a Word document")
            .WithDescription(
                "For the applications that will not take a PDF. One column, no tables and no " +
                "images, because that is what an applicant-tracking system can read.")
            .Produces<IResult>(StatusCodes.Status200OK, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
            .CacheOutput(p => p.Expire(TimeSpan.FromSeconds(60)).Tag(ResumeTags))
            .RequireRateLimiting("api");

        app.MapGet("/api/external/stats", (ISender sender, CancellationToken ct) =>
                sender.Send(new GetExternalStatsQuery(), ct))
            .WithTags("Analytics")
            .WithName("GetExternalStats")
            .WithSummary("Stack Overflow, credentials, Docker Hub and Medium")
            .WithDescription(
                "Each source is independent and each may be absent. Absent means the service is " +
                "not configured or has nothing to show, and its section is not rendered — never a " +
                "zero, which would be a different and usually false claim.")
            .Produces<ExternalStatsDto>()
            .CacheOutput(p => p.Expire(TimeSpan.FromMinutes(10)).Tag(CacheTags.ExternalStats))
            .RequireRateLimiting("api");

        /*
          Ask. A GET rather than a POST, deliberately: the question is a lookup with no
          side effect, so it caches, it is shareable as a link, and it needs no
          antiforgery. Varying the cache by the query string is what makes that safe —
          without it every visitor would be served the first visitor's answer.
        */
        app.MapGet("/api/ask", (string? q, string? context, ISender sender, CancellationToken ct) =>
                sender.Send(new AskQuery(q ?? string.Empty, context), ct))
            .WithTags("Ask")
            .WithName("Ask")
            .WithSummary("Answer a question from this site's own content")
            .WithDescription(
                "Retrieval, not generation. Every answer is assembled from rows already on the " +
                "site and carries the pages it came from, so it cannot invent a role, a skill or " +
                "a credential. No model, no key, no per-question cost. A question it cannot " +
                "answer returns `matched: none` and says so rather than guessing.")
            .Produces<AskAnswerDto>()
            .CacheOutput(p => p.Expire(TimeSpan.FromMinutes(5))
                .SetVaryByQuery("q", "context")
                .Tag(CacheTags.Projects))
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
