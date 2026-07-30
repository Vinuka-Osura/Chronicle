using Chronicle.Application.Common.Content;
using Chronicle.Application.Common.Exceptions;
using Chronicle.Application.Common.Interfaces;
using Chronicle.Domain.Entities;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Projects.Commands.SaveProject;

public sealed class SaveProjectCommandHandler(
    IChronicleDbContext db,
    IContentCacheInvalidator cache) : IRequestHandler<SaveProjectCommand, Guid>
{
    public async Task<Guid> Handle(SaveProjectCommand request, CancellationToken cancellationToken)
    {
        var slugTaken = await db.Projects
            .AnyAsync(p => p.Slug == request.Slug && p.Id != request.Id, cancellationToken)
            .ConfigureAwait(false);

        if (slugTaken)
        {
            throw new ValidationException(
            [
                new ValidationFailure(
                    nameof(SaveProjectCommand.Slug),
                    $"Another project already uses '{request.Slug}'.")
            ]);
        }

        var (skills, unknownSkills) = await Taxonomy
            .ResolveSkillsAsync(db, request.TechStack, cancellationToken)
            .ConfigureAwait(false);

        if (unknownSkills.Count > 0)
        {
            // Rejected rather than created. A skill carries years of experience and a
            // proficiency level that only a person can set, so a typo here would
            // otherwise seed a "Kubernets" with zero years and put it on the skills page.
            throw new ValidationException(
            [
                new ValidationFailure(
                    nameof(SaveProjectCommand.TechStack),
                    $"Not a known skill: {string.Join(", ", unknownSkills)}. Add it on the Skills page first.")
            ]);
        }

        Project project;

        if (request.Id is { } id)
        {
            project = await db.Projects
                .Include(p => p.Tags)
                .Include(p => p.TechStack)
                .FirstOrDefaultAsync(p => p.Id == id, cancellationToken)
                .ConfigureAwait(false)
                ?? throw new NotFoundException(nameof(Project), id);
        }
        else
        {
            project = new Project();
            db.Projects.Add(project);
        }

        project.Title = request.Title;
        project.Slug = request.Slug;
        project.Pitch = request.Pitch;
        project.Problem = request.Problem;
        project.Solution = request.Solution;
        project.KeyDecisions = Blank(request.KeyDecisions);
        project.ArchitectureNotes = Blank(request.ArchitectureNotes);
        project.ArchitectureDiagramUrl = Blank(request.ArchitectureDiagramUrl);
        project.Results = Blank(request.Results);
        project.LessonsLearned = Blank(request.LessonsLearned);
        project.VideoUrl = Blank(request.VideoUrl);
        project.GithubUrl = Blank(request.GithubUrl);
        project.DemoUrl = Blank(request.DemoUrl);
        project.DocsUrl = Blank(request.DocsUrl);
        project.StartDate = request.StartDate;
        project.EndDate = request.EndDate;
        project.Featured = request.Featured;
        project.SortOrder = request.SortOrder;

        var tags = await Taxonomy.ResolveTagsAsync(db, request.Tags, cancellationToken)
            .ConfigureAwait(false);

        project.Tags.Clear();
        foreach (var tag in tags)
        {
            project.Tags.Add(tag);
        }

        project.TechStack.Clear();
        foreach (var skill in skills)
        {
            project.TechStack.Add(skill);
        }

        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        // Every page a project appears on. Skills is in the list because the "used in"
        // list there is derived from this join table, so editing a tech stack changes
        // the skills page even though no skill row moved.
        await cache.EvictAsync(
                cancellationToken,
                [CacheTags.Projects, CacheTags.Skills, .. CacheTags.Chronology])
            .ConfigureAwait(false);

        return project.Id;
    }

    /// <summary>
    /// An empty textarea posts "" , not null. Storing that would make an optional section
    /// present-but-blank, and the public page hides sections on null - so it would render
    /// an empty heading instead of nothing.
    /// </summary>
    private static string? Blank(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
