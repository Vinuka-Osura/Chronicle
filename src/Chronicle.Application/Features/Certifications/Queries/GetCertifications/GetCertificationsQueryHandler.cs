using Chronicle.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Certifications.Queries.GetCertifications;

public sealed class GetCertificationsQueryHandler(IChronicleDbContext db, IDateTimeProvider clock)
    : IRequestHandler<GetCertificationsQuery, IReadOnlyList<CertificationDto>>
{
    public async Task<IReadOnlyList<CertificationDto>> Handle(
        GetCertificationsQuery request,
        CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(clock.UtcNow.UtcDateTime);

        return await db.Certifications
            .AsNoTracking()
            // Kind first, then most recent. Matches the merged projection in
            // GetExternalStatsQueryHandler, so two endpoints over the same table no longer
            // return the same credentials in two different orders.
            .OrderBy(c => c.Kind)
            .ThenByDescending(c => c.IssueDate)
            .ThenBy(c => c.SortOrder)
            .Select(c => new CertificationDto(
                c.Name,
                c.Issuer,
                c.Kind,
                c.IssueDate,
                c.ExpiryDate,
                c.ExpiryDate != null && c.ExpiryDate < today,
                c.CredentialUrl,
                c.LogoUrl))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }
}
