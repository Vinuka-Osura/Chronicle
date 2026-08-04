using MediatR;

namespace Chronicle.Application.Features.Analytics.Queries.GetExternalStats;

/// <summary>Everything the Analytics page shows that does not come from GitHub.</summary>
public sealed record GetExternalStatsQuery : IRequest<ExternalStatsDto>;
