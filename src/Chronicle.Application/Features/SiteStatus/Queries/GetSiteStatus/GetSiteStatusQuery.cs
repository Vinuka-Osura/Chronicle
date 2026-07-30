using MediatR;

namespace Chronicle.Application.Features.SiteStatus.Queries.GetSiteStatus;

public sealed record GetSiteStatusQuery : IRequest<SiteStatusDto>;
