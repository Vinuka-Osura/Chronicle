using Chronicle.Application.Common.Interfaces;
using Chronicle.Application.Features.Posts;
using Chronicle.Application.Features.Posts.Queries.GetPostBySlug;
using Chronicle.Application.Features.Posts.Queries.GetPosts;
using Chronicle.Application.Features.Posts.Queries.SearchPosts;
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
                // Both filters, or the first caller's results are served to everyone.
                .SetVaryByQuery("tag", "q")
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

        // Before the {slug} route, or "search" is read as a slug and 404s.
        group.MapGet("/search", (
                ISender sender,
                CancellationToken cancellationToken,
                string q) =>
                sender.Send(new SearchPostsQuery(q), cancellationToken))
            .WithName("SearchPosts")
            .WithSummary("Ranked full-text search across articles")
            .WithDescription(
                "Matches title, excerpt and body, weighted in that order, so an article about " +
                "a subject outranks one that mentions it once. Understands quoted phrases, OR, " +
                "and a leading - to exclude a word.")
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
