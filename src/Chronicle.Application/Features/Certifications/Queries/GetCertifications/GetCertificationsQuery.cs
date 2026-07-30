using MediatR;

namespace Chronicle.Application.Features.Certifications.Queries.GetCertifications;

public sealed record GetCertificationsQuery : IRequest<IReadOnlyList<CertificationDto>>;
