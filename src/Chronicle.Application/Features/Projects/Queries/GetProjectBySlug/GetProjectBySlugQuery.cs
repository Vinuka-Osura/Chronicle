using MediatR;

namespace Chronicle.Application.Features.Projects.Queries.GetProjectBySlug;

public sealed record GetProjectBySlugQuery(string Slug) : IRequest<ProjectDetailDto>;
