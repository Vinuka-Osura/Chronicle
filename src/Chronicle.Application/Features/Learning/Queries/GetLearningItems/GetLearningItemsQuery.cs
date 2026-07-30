using MediatR;

namespace Chronicle.Application.Features.Learning.Queries.GetLearningItems;

public sealed record GetLearningItemsQuery : IRequest<IReadOnlyList<LearningItemDto>>;
