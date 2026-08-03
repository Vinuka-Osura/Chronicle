using Chronicle.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Projects.Queries.GetProjects;

/// <remarks>
/// This handler is the reference pattern for every read slice in the codebase:
/// filter on <see cref="IQueryable{T}"/>, project straight to the DTO inside the
/// query, and never materialise entities. The projection is what keeps this to a
/// single SELECT of only the columns the card actually shows - mapping after
/// materialisation would pull every Markdown case-study column across the wire
/// to render a card that displays none of them.
/// </remarks>
public sealed class GetProjectsQueryHandler(IChronicleDbContext db)
    : IRequestHandler<GetProjectsQuery, IReadOnlyList<ProjectCardDto>>
{
    public async Task<IReadOnlyList<ProjectCardDto>> Handle(
        GetProjectsQuery request,
        CancellationToken cancellationToken)
    {
        var query = db.Projects.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Tag))
        {
            query = query.Where(p => p.Tags.Any(t => t.Slug == request.Tag));
        }

        if (request.Featured is { } featured)
        {
            query = query.Where(p => p.Featured == featured);
        }

        return await query
            /*
              Featured first, then whatever order the editor set, then most recent.

              SortOrder used to be the LAST tiebreaker, behind the start date — which
              meant setting it in the admin did nothing at all unless two projects
              happened to share a date. The field existed, the form existed, and the
              order it produced was still chronological. It decides now, and the date
              is what settles projects the editor has not ranked against each other.

              Matches the index on (Featured desc, SortOrder, StartDate desc).
            */
            .OrderByDescending(p => p.Featured)
            .ThenBy(p => p.SortOrder)
            .ThenByDescending(p => p.StartDate)
            .Select(p => new ProjectCardDto(
                p.Slug,
                p.Title,
                p.Pitch,
                p.Featured,
                p.StartDate,
                p.EndDate,
                p.Tags.OrderBy(t => t.Name).Select(t => t.Name).ToList(),
                p.TechStack.OrderBy(s => s.SortOrder).Select(s => s.Name).ToList(),
                p.Screenshots.OrderBy(m => m.SortOrder).Select(m => m.Url).FirstOrDefault()))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
    }
}
