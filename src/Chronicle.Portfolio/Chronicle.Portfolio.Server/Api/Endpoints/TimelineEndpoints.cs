using Chronicle.Application.Common.Interfaces;
using Chronicle.Application.Features.Timeline;
using Chronicle.Application.Features.Timeline.Queries.GetTimeline;
using MediatR;

namespace Chronicle.Portfolio.Server.Api.Endpoints;

public static class TimelineEndpoints
{
    public static IEndpointRouteBuilder MapTimelineEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/timeline", (ISender sender, CancellationToken ct) =>
                sender.Send(new GetTimelineQuery(), ct))
            .WithTags("Timeline")
            .WithName("GetTimeline")
            .WithSummary("Career and life merged into one chronological stream")
            .WithDescription(
                "Returns eras, the server's date for the today boundary, and every item sorted " +
                "ascending. Connections between items are derived from shared skills and tags on " +
                "each request, never stored, so they cannot go stale.")
            .Produces<TimelineResponse>()
            // Six sources feed this, so any of their commands must evict it. That is why
            // Chronology exists as a tag group rather than six separate strings.
            .CacheOutput(p => p.Expire(TimeSpan.FromSeconds(60)).Tag(CacheTags.Timeline))
            .RequireRateLimiting("api");

        return app;
    }
}
