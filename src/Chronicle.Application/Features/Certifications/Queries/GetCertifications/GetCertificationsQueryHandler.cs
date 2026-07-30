using Chronicle.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Certifications.Queries.GetCertifications;

public sealed class GetCertificationsQueryHandler(IChronicleDbContext db)
    : IRequestHandler<GetCertificationsQuery, IReadOnlyList<CertificationDto>>
{
    public async Task<IReadOnlyList<CertificationDto>> Handle(
        GetCertificationsQuery request,
        CancellationToken cancellationToken)
    {
        return await db.Certifications
            .AsNoTracking()
            .OrderByDescending(c => c.IssueDate)
            .ThenBy(c => c.SortOrder)
            .Select(c => new CertificationDto(
                c.Name,
                c.Issuer,
                c.IssueDate,
                c.CredentialUrl,
                c.LogoUrl))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }
}
