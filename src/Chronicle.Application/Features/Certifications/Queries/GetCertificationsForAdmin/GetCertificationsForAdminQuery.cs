using Chronicle.Application.Common.Exceptions;
using Chronicle.Application.Common.Interfaces;
using Chronicle.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Certifications.Queries.GetCertificationsForAdmin;

/// <summary>Credentials as stored, with their ids and the skills they attest to.</summary>
public sealed record GetCertificationsForAdminQuery : IRequest<IReadOnlyList<AdminCertificationRow>>;

public sealed record AdminCertificationRow(
    Guid Id,
    string Name,
    string Issuer,
    DateOnly IssueDate,
    string? CredentialUrl,
    string? LogoUrl,
    int SortOrder,
    IReadOnlyList<string> Skills);

public sealed class GetCertificationsForAdminQueryHandler(IChronicleDbContext db)
    : IRequestHandler<GetCertificationsForAdminQuery, IReadOnlyList<AdminCertificationRow>>
{
    public async Task<IReadOnlyList<AdminCertificationRow>> Handle(
        GetCertificationsForAdminQuery request,
        CancellationToken cancellationToken)
    {
        return await db.Certifications
            .AsNoTracking()
            .OrderBy(c => c.SortOrder)
            .ThenByDescending(c => c.IssueDate)
            .Select(c => new AdminCertificationRow(
                c.Id,
                c.Name,
                c.Issuer,
                c.IssueDate,
                c.CredentialUrl,
                c.LogoUrl,
                c.SortOrder,
                c.Skills.Select(s => s.Name).OrderBy(name => name).ToList()))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }
}
