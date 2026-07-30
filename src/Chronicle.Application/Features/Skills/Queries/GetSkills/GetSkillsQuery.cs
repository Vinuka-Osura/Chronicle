using MediatR;

namespace Chronicle.Application.Features.Skills.Queries.GetSkills;

public sealed record GetSkillsQuery : IRequest<IReadOnlyList<SkillGroupDto>>;
