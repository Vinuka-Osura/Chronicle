using Chronicle.Application.Common.Interfaces;
using Chronicle.Application.Features.Skills;
using Chronicle.Application.Features.Skills.Queries.GetSkills;
using MediatR;

namespace Chronicle.Portfolio.Server.Api.Endpoints;

public static class SkillEndpoints
{
    public static IEndpointRouteBuilder MapSkillEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/skills", (ISender sender, CancellationToken ct) =>
                sender.Send(new GetSkillsQuery(), ct))
            .WithTags("Skills")
            .WithName("GetSkills")
            .WithSummary("Skills grouped by category, each with the work that used it")
            .WithDescription(
                "The usedIn list is derived from the project and experience join tables on every " +
                "request, so it can never disagree with the work that actually references the skill.")
            .Produces<IReadOnlyList<SkillGroupDto>>()
            // Skills change when projects or roles change, so this tag is evicted by
            // those commands too.
            .CacheOutput(p => p.Expire(TimeSpan.FromSeconds(60)).Tag(CacheTags.Skills))
            .RequireRateLimiting("api");

        return app;
    }
}
