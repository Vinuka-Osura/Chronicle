using Chronicle.Application.Common.Exceptions;
using Chronicle.Application.Common.Interfaces;
using Chronicle.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Projects.Queries.GetProjectForEdit;

/// <summary>Every editable field of a project, including the ones the public card omits.</summary>
public sealed record GetProjectForEditQuery(Guid Id) : IRequest<ProjectEditModel>;

public sealed record ProjectEditModel(
    Guid Id,
    string Title,
    string Slug,
    string Pitch,
    string Problem,
    string Solution,
    string? KeyDecisions,
    string? ArchitectureNotes,
    string? ArchitectureDiagramUrl,
    string? Results,
    string? LessonsLearned,
    string? VideoUrl,
    string? GithubUrl,
    string? DemoUrl,
    string? DocsUrl,
    DateOnly StartDate,
    DateOnly? EndDate,
    bool Featured,
    int SortOrder,
    IReadOnlyList<string> Tags,
    IReadOnlyList<string> TechStack);

public sealed class GetProjectForEditQueryHandler(IChronicleDbContext db)
    : IRequestHandler<GetProjectForEditQuery, ProjectEditModel>
{
    public async Task<ProjectEditModel> Handle(
        GetProjectForEditQuery request,
        CancellationToken cancellationToken)
    {
        return await db.Projects
            .AsNoTracking()
            .Where(p => p.Id == request.Id)
            .Select(p => new ProjectEditModel(
                p.Id,
                p.Title,
                p.Slug,
                p.Pitch,
                p.Problem,
                p.Solution,
                p.KeyDecisions,
                p.ArchitectureNotes,
                p.ArchitectureDiagramUrl,
                p.Results,
                p.LessonsLearned,
                p.VideoUrl,
                p.GithubUrl,
                p.DemoUrl,
                p.DocsUrl,
                p.StartDate,
                p.EndDate,
                p.Featured,
                p.SortOrder,
                p.Tags.Select(t => t.Name).OrderBy(name => name).ToList(),
                p.TechStack.Select(s => s.Name).OrderBy(name => name).ToList()))
            .FirstOrDefaultAsync(cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Project), request.Id);
    }
}
