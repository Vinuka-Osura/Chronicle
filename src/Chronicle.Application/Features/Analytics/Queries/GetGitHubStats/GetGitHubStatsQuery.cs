using MediatR;

namespace Chronicle.Application.Features.Analytics.Queries.GetGitHubStats;

public sealed record GetGitHubStatsQuery : IRequest<GitHubStatsDto>;
