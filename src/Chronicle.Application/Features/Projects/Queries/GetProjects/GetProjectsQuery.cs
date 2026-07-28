using MediatR;

namespace Chronicle.Application.Features.Projects.Queries.GetProjects;

/// <param name="Tag">Optional tag slug filter.</param>
/// <param name="Featured">Optional featured filter. Null means "both".</param>
public sealed record GetProjectsQuery(string? Tag = null, bool? Featured = null)
    : IRequest<IReadOnlyList<ProjectCardDto>>;
