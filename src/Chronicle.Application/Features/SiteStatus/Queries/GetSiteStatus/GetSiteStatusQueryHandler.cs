using Chronicle.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.SiteStatus.Queries.GetSiteStatus;

public sealed class GetSiteStatusQueryHandler(IChronicleDbContext db)
    : IRequestHandler<GetSiteStatusQuery, SiteStatusDto>
{
    public async Task<SiteStatusDto> Handle(
        GetSiteStatusQuery request,
        CancellationToken cancellationToken)
    {
        var status = await db.SiteStatuses
            .AsNoTracking()
            .Select(s => new SiteStatusDto(s.CurrentFocus, s.Mood, s.UpdatedAt, null))
            .FirstOrDefaultAsync(cancellationToken)
            .ConfigureAwait(false);

        // A single-row table with no row is a seeding gap, not a client error. The home
        // page is not worth a 500, so it gets an honest placeholder instead.
        return status ?? new SiteStatusDto(
            "Currently heads-down on something.",
            null,
            DateTimeOffset.UtcNow,
            null);
    }
}
