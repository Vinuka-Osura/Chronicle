using Chronicle.Application.Common.Content;
using Chronicle.Application.Common.Exceptions;
using Chronicle.Application.Common.Interfaces;
using FluentValidation;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ExperienceEntity = Chronicle.Domain.Entities.Experience;
using ValidationException = Chronicle.Application.Common.Exceptions.ValidationException;

namespace Chronicle.Application.Features.Experience.Commands.SaveExperience;

/// <param name="Highlights">
/// One per line as typed. Stored as jsonb, because the count varies per role and a
/// child table for a handful of strings that are only ever read together with their
/// parent would be a join for nothing.
/// </param>
public sealed record SaveExperienceCommand(
    Guid? Id,
    string Role,
    string Company,
    DateOnly StartDate,
    DateOnly? EndDate,
    string Summary,
    IReadOnlyList<string> Highlights,
    IReadOnlyList<string> TechStack,
    int SortOrder) : IRequest<Guid>;

public sealed class SaveExperienceCommandValidator : AbstractValidator<SaveExperienceCommand>
{
    public SaveExperienceCommandValidator()
    {
        RuleFor(c => c.Role).NotEmpty().MaximumLength(150);
        RuleFor(c => c.Company).NotEmpty().MaximumLength(150);
        RuleFor(c => c.Summary).NotEmpty().MaximumLength(1000);

        RuleFor(c => c.EndDate)
            .GreaterThanOrEqualTo(c => c.StartDate)
            .When(c => c.EndDate.HasValue)
            .WithMessage("A role cannot end before it started. Leave the end date empty if it is current.");

        RuleForEach(c => c.Highlights).NotEmpty().MaximumLength(300);
    }
}

public sealed class SaveExperienceCommandHandler(
    IChronicleDbContext db,
    IContentCacheInvalidator cache) : IRequestHandler<SaveExperienceCommand, Guid>
{
    public async Task<Guid> Handle(SaveExperienceCommand request, CancellationToken cancellationToken)
    {
        var (skills, unknown) = await Taxonomy
            .ResolveSkillsAsync(db, request.TechStack, cancellationToken)
            .ConfigureAwait(false);

        if (unknown.Count > 0)
        {
            throw new ValidationException(
            [
                new ValidationFailure(
                    nameof(SaveExperienceCommand.TechStack),
                    $"Not a known skill: {string.Join(", ", unknown)}. Add it on the Skills page first.")
            ]);
        }

        ExperienceEntity role;

        if (request.Id is { } id)
        {
            role = await db.Experiences
                .Include(e => e.TechStack)
                .FirstOrDefaultAsync(e => e.Id == id, cancellationToken)
                .ConfigureAwait(false)
                ?? throw new NotFoundException(nameof(ExperienceEntity), id);
        }
        else
        {
            role = new ExperienceEntity();
            db.Experiences.Add(role);
        }

        role.Role = request.Role.Trim();
        role.Company = request.Company.Trim();
        role.StartDate = request.StartDate;
        role.EndDate = request.EndDate;
        role.Summary = request.Summary.Trim();
        role.SortOrder = request.SortOrder;

        // Replaced wholesale rather than diffed. Highlights are a list the operator
        // rewrites as a block, and EF marks the owner modified either way.
        role.Highlights = [.. request.Highlights
            .Select(h => h.Trim())
            .Where(h => h.Length > 0)];

        role.TechStack.Clear();
        foreach (var skill in skills)
        {
            role.TechStack.Add(skill);
        }

        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        // A role is a timeline node and a source of the skills page's "used in" list, so
        // three surfaces change even though only this row moved.
        await cache.EvictAsync(
                cancellationToken,
                [CacheTags.Experience, CacheTags.Skills, .. CacheTags.Chronology])
            .ConfigureAwait(false);

        return role.Id;
    }
}
