using Chronicle.Application.Common.Interfaces;
using Chronicle.Application.Features.Posts;
using Chronicle.Application.Features.Posts.Queries.GetPostBySlug;
using Chronicle.Application.Features.Posts.Queries.GetPosts;
using MediatR;

namespace Chronicle.Portfolio.Server.Api.Endpoints;

public static class PostEndpoints
{
    public static IEndpointRouteBuilder MapPostEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/posts")
            .WithTags("Posts")
            .CacheOutput(p => p
                .Expire(TimeSpan.FromSeconds(60))
                .SetVaryByQuery("tag")
                .Tag(CacheTags.Posts))
            .RequireRateLimiting("api");

        group.MapGet("/", (
                ISender sender,
                CancellationToken cancellationToken,
                string? tag = null) =>
                sender.Send(new GetPostsQuery(tag), cancellationToken))
            .WithName("GetPosts")
            .WithSummary("Published articles, newest first")
            .WithDescription("Drafts are never returned. Optionally filtered by tag slug.")
            .Produces<IReadOnlyList<PostCardDto>>()
            .ProducesValidationProblem();

        group.MapGet("/{slug}", (
                ISender sender,
                string slug,
                CancellationToken cancellationToken) =>
                sender.Send(new GetPostBySlugQuery(slug), cancellationToken))
            .WithName("GetPostBySlug")
            .WithSummary("A single published article")
            .WithDescription("bodyMarkdown is returned raw for the client to render and sanitise.")
            .Produces<PostDetailDto>()
            .ProducesProblem(StatusCodes.Status404NotFound);

        return app;
    }
}
