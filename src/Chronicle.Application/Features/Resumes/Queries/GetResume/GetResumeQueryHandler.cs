using Chronicle.Application.Common.Interfaces;
using Chronicle.Application.Features.Certifications.Queries.GetCertifications;
using Chronicle.Application.Features.Experience.Queries.GetExperience;
using Chronicle.Application.Features.Profile.Queries.GetProfile;
using Chronicle.Application.Features.Projects.Queries.GetProjects;
using Chronicle.Application.Features.Skills.Queries.GetSkills;
using Chronicle.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Resumes.Queries.GetResume;

/// <summary>
/// Assembles the CV from the queries the public pages already use.
/// </summary>
/// <remarks>
/// <para>
/// Composed through <see cref="ISender"/> rather than re-querying the tables directly.
/// That is a deliberate choice and the reason for it is the whole point of this feature:
/// the ordering rules, the published filter and the skills' derived usage lists all live
/// in those handlers, and a second copy of them here would be a second definition of what
/// the CV says. Re-running them costs a handful of local queries on a page nobody loads
/// in a loop.
/// </para>
/// <para>
/// Education is the exception — it is read straight from milestones, because there is no
/// education query to reuse. The timeline merges it into a mixed feed the CV cannot use.
/// </para>
/// </remarks>
public sealed class GetResumeQueryHandler(ISender sender, IChronicleDbContext db)
    : IRequestHandler<GetResumeQuery, ResumeDto>
{
    public async Task<ResumeDto> Handle(GetResumeQuery request, CancellationToken cancellationToken)
    {
        var profile = await sender.Send(new GetProfileQuery(), cancellationToken).ConfigureAwait(false);
        var roles = await sender.Send(new GetExperienceQuery(), cancellationToken).ConfigureAwait(false);
        var projects = await sender.Send(new GetProjectsQuery(), cancellationToken).ConfigureAwait(false);
        var skills = await sender.Send(new GetSkillsQuery(), cancellationToken).ConfigureAwait(false);
        var certifications = await sender.Send(new GetCertificationsQuery(), cancellationToken).ConfigureAwait(false);

        var education = await db.Milestones
            .AsNoTracking()
            .Where(m => m.Category == MilestoneCategory.Education)
            // Most recent first, matching every other section. A CV read top-down should
            // never change direction halfway.
            .OrderByDescending(m => m.Date)
            .Select(m => new ResumeEducationDto(
                m.Title,
                m.Description,
                m.Date,
                m.EndDate))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return new ResumeDto(
            profile,
            roles,
            education,
            // Already ordered featured-first by the projects handler, so taking the first
            // few takes the ones chosen in the CMS rather than the newest by accident.
            [.. projects.Take(Math.Max(0, request.MaxProjects))],
            skills,
            certifications);
    }
}
