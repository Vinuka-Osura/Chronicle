using Chronicle.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.SiteStatus.Queries.GetSiteStatus;

/// <summary>
/// The two halves of the status strip, from their two different places.
/// </summary>
/// <remarks>
/// The editorial half is written in the CMS; the last-commit half comes from the cached
/// GitHub payload, so it costs a row read rather than a network call. Neither half can
/// fail the other: a missing status row falls back to a placeholder, and unreachable
/// GitHub leaves the commit line simply absent.
/// </remarks>
public sealed class GetSiteStatusQueryHandler(IChronicleDbContext db, IGitHubService github)
    : IRequestHandler<GetSiteStatusQuery, SiteStatusDto>
{
    public async Task<SiteStatusDto> Handle(
        GetSiteStatusQuery request,
        CancellationToken cancellationToken)
    {
        var status = await db.SiteStatuses
            .AsNoTracking()
            .Select(s => new { s.CurrentFocus, s.Mood, s.UpdatedAt })
            .FirstOrDefaultAsync(cancellationToken)
            .ConfigureAwait(false);

        var stats = await github.GetStatsAsync(cancellationToken).ConfigureAwait(false);

        var lastCommit = stats.LastCommit is { } commit
            ? new LastCommitDto(commit.Message, commit.Repo, commit.When)
            : null;

        // A single-row table with no row is a seeding gap, not a client error. The home
        // page is not worth a 500, so it gets an honest placeholder instead.
        return status is null
            ? new SiteStatusDto(
                "Currently heads-down on something.",
                null,
                DateTimeOffset.UtcNow,
                lastCommit)
            : new SiteStatusDto(status.CurrentFocus, status.Mood, status.UpdatedAt, lastCommit);
    }
}
