using Chronicle.Application.Common.Interfaces;
using Chronicle.Application.Features.Projects;
using Chronicle.Application.Features.Projects.Queries.GetProjectBySlug;
using Chronicle.Application.Features.Projects.Queries.GetProjects;
using MediatR;

namespace Chronicle.Portfolio.Server.Api.Endpoints;

/// <summary>
/// Reference endpoint group. Every other resource follows this shape: a cached,
/// tagged group; endpoints that do nothing but translate HTTP into a MediatR request.
/// </summary>
public static class ProjectEndpoints
{
    public static IEndpointRouteBuilder MapProjectEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/projects")
            .WithTags("Projects")
            // Tagged so admin commands can evict precisely what they changed instead
            // of waiting out the TTL. See IContentCacheInvalidator.
            .CacheOutput(p => p
                .Expire(TimeSpan.FromSeconds(60))
                .SetVaryByQuery("tag", "featured")
                .Tag(CacheTags.Projects))
            .RequireRateLimiting("api");

        group.MapGet("/", (
                ISender sender,
                CancellationToken cancellationToken,
                string? tag = null,
                bool? featured = null) =>
                sender.Send(new GetProjectsQuery(tag, featured), cancellationToken))
            .WithName("GetProjects")
            .WithSummary("List projects")
            .WithDescription("Card-shaped projects, featured first then most recent. Optionally filtered by tag slug.")
            .Produces<IReadOnlyList<ProjectCardDto>>()
            .ProducesValidationProblem();

        group.MapGet("/{slug}", (
                ISender sender,
                string slug,
                CancellationToken cancellationToken) =>
                sender.Send(new GetProjectBySlugQuery(slug), cancellationToken))
            .WithName("GetProjectBySlug")
            .WithSummary("Get a full case study")
            .WithDescription("The eight-part case study. Markdown fields are returned raw for the client to render and sanitise.")
            .Produces<ProjectDetailDto>()
            .ProducesProblem(StatusCodes.Status404NotFound);

        return app;
    }
}
