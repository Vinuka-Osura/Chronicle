using Chronicle.Application.Common.Exceptions;
using Chronicle.Application.Common.Interfaces;
using Chronicle.Domain.Entities;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Skills.Commands.DeleteSkill;

public sealed record DeleteSkillCommand(Guid Id) : IRequest;

public sealed class DeleteSkillCommandHandler(
    IChronicleDbContext db,
    IContentCacheInvalidator cache) : IRequestHandler<DeleteSkillCommand>
{
    public async Task Handle(DeleteSkillCommand request, CancellationToken cancellationToken)
    {
        var skill = await db.Skills
            .Include(s => s.Projects)
            .Include(s => s.Experiences)
            .Include(s => s.Certifications)
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken)
            .ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(Skill), request.Id);

        /*
          Refused while anything still references it.

          The join rows would cascade away silently, quietly stripping a technology out
          of every case study that listed it - a data loss the operator did not ask for
          and would not notice until someone read the project page. Saying which things
          are in the way turns this into a two-minute job instead of a mystery.
        */
        var users = new List<string>();
        if (skill.Projects.Count > 0) users.Add($"{skill.Projects.Count} project(s)");
        if (skill.Experiences.Count > 0) users.Add($"{skill.Experiences.Count} role(s)");
        if (skill.Certifications.Count > 0) users.Add($"{skill.Certifications.Count} certification(s)");

        if (users.Count > 0)
        {
            throw new ValidationException(
            [
                new ValidationFailure(
                    nameof(DeleteSkillCommand.Id),
                    $"'{skill.Name}' is still used by {string.Join(", ", users)}. "
                    + "Remove it from those first.")
            ]);
        }

        db.Skills.Remove(skill);
        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        await cache.EvictAsync(cancellationToken, CacheTags.Skills).ConfigureAwait(false);
    }
}
