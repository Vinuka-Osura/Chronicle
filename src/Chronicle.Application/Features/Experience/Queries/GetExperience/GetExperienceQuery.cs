using MediatR;

namespace Chronicle.Application.Features.Experience.Queries.GetExperience;

public sealed record GetExperienceQuery : IRequest<IReadOnlyList<ExperienceDto>>;
