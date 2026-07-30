using Chronicle.Application.Common.Exceptions;
using Chronicle.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Projects.Queries.GetProjectBySlug;

public sealed class GetProjectBySlugQueryHandler(IChronicleDbContext db)
    : IRequestHandler<GetProjectBySlugQuery, ProjectDetailDto>
{
    public async Task<ProjectDetailDto> Handle(
        GetProjectBySlugQuery request,
        CancellationToken cancellationToken)
    {
        var project = await db.Projects
            .AsNoTracking()
            .Where(p => p.Slug == request.Slug)
            .Select(p => new ProjectDetailDto(
                p.Slug,
                p.Title,
                p.Pitch,
                p.Problem,
                p.Solution,
                p.KeyDecisions,
                p.ArchitectureNotes,
                p.ArchitectureDiagramUrl,
                p.ArchitectureDiagram,
                p.Results,
                p.LessonsLearned,
                p.VideoUrl,
                p.GithubUrl,
                p.DemoUrl,
                p.DocsUrl,
                p.StartDate,
                p.EndDate,
                p.Featured,
                p.Tags.OrderBy(t => t.Name).Select(t => t.Name).ToList(),
                p.TechStack.OrderBy(s => s.SortOrder).Select(s => s.Name).ToList(),
                p.Screenshots
                    .OrderBy(m => m.SortOrder)
                    .Select(m => new ScreenshotDto(m.Url, m.Caption))
                    .ToList()))
            .FirstOrDefaultAsync(cancellationToken)
            .ConfigureAwait(false);

        return project ?? throw new NotFoundException("Project", request.Slug);
    }
}
