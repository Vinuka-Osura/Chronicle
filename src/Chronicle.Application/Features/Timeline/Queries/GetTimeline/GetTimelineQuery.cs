using MediatR;

namespace Chronicle.Application.Features.Timeline.Queries.GetTimeline;

public sealed record GetTimelineQuery : IRequest<TimelineResponse>;
