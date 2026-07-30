using MediatR;

namespace Chronicle.Application.Features.Roadmap.Queries.GetRoadmapItems;

public sealed record GetRoadmapItemsQuery : IRequest<IReadOnlyList<RoadmapItemDto>>;
