using Chronicle.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Profile.Queries.GetProfile;

public sealed class GetProfileQueryHandler(IChronicleDbContext db)
    : IRequestHandler<GetProfileQuery, ProfileDto?>
{
    public Task<ProfileDto?> Handle(GetProfileQuery request, CancellationToken cancellationToken)
        => db.Profiles
            .AsNoTracking()
            .Select(p => new ProfileDto(
                p.FullName,
                p.Headline,
                p.Summary,
                p.Email,
                p.Phone,
                p.Location,
                p.LinkedInUrl,
                p.GitHubUrl,
                p.WebsiteUrl,
                p.FacebookUrl,
                p.InstagramUrl,
                p.XUrl,
                p.Availability,
                p.GitHubUsername,
                p.StackOverflowUserId,
                p.CredlyUsername,
                p.DockerHubUsername,
                p.MediumUsername))
            .FirstOrDefaultAsync(cancellationToken);
}
