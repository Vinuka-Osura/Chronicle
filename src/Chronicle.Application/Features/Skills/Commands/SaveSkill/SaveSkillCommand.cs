using Chronicle.Application.Common.Exceptions;
using Chronicle.Application.Common.Interfaces;
using Chronicle.Domain.Entities;
using Chronicle.Domain.Enums;
using FluentValidation;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ValidationException = Chronicle.Application.Common.Exceptions.ValidationException;

namespace Chronicle.Application.Features.Skills.Commands.SaveSkill;

public sealed record SaveSkillCommand(
    Guid? Id,
    string Name,
    SkillCategory Category,
    decimal YearsExperience,
    ProficiencyLevel Proficiency,
    int SortOrder) : IRequest<Guid>;

public sealed class SaveSkillCommandValidator : AbstractValidator<SaveSkillCommand>
{
    public SaveSkillCommandValidator()
    {
        RuleFor(c => c.Name).NotEmpty().MaximumLength(60);

        RuleFor(c => c.YearsExperience)
            .InclusiveBetween(0m, 60m)
            .WithMessage("Years has to be between 0 and 60.");

        RuleFor(c => c.Category).IsInEnum();
        RuleFor(c => c.Proficiency).IsInEnum();
    }
}

public sealed class SaveSkillCommandHandler(
    IChronicleDbContext db,
    IContentCacheInvalidator cache) : IRequestHandler<SaveSkillCommand, Guid>
{
    public async Task<Guid> Handle(SaveSkillCommand request, CancellationToken cancellationToken)
    {
        // Names are the join key that project and experience tech stacks match on, so two
        // skills differing only in case would silently split every "used in" list in
        // half. Compared on upper() at both ends, matching Taxonomy - the comparison has
        // to happen in the database, and string.Equals with a StringComparison is what
        // CA1862 wants but is not what Npgsql translates.
#pragma warning disable CA1311, CA1862 // SQL-translatable comparison, not a display string.
        var key = request.Name.Trim().ToUpper();

        var nameTaken = await db.Skills
            .AnyAsync(s => s.Name.ToUpper() == key && s.Id != request.Id, cancellationToken)
            .ConfigureAwait(false);
#pragma warning restore CA1311, CA1862

        if (nameTaken)
        {
            throw new ValidationException(
            [
                new ValidationFailure(
                    nameof(SaveSkillCommand.Name),
                    $"'{request.Name.Trim()}' already exists. Edit that one instead of adding a second.")
            ]);
        }

        Skill skill;

        if (request.Id is { } id)
        {
            skill = await db.Skills
                .FirstOrDefaultAsync(s => s.Id == id, cancellationToken)
                .ConfigureAwait(false)
                ?? throw new NotFoundException(nameof(Skill), id);
        }
        else
        {
            skill = new Skill();
            db.Skills.Add(skill);
        }

        skill.Name = request.Name.Trim();
        skill.Category = request.Category;
        skill.YearsExperience = request.YearsExperience;
        skill.Proficiency = request.Proficiency;
        skill.SortOrder = request.SortOrder;

        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        // Projects and the résumé both print skill names, so a rename has to reach them
        // as well as the skills page.
        await cache.EvictAsync(cancellationToken, CacheTags.Skills, CacheTags.Projects)
            .ConfigureAwait(false);

        return skill.Id;
    }
}
