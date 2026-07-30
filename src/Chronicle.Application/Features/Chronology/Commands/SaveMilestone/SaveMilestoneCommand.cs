using Chronicle.Application.Common.Content;
using Chronicle.Application.Common.Exceptions;
using Chronicle.Application.Common.Interfaces;
using Chronicle.Domain.Entities;
using Chronicle.Domain.Enums;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Chronology.Commands.SaveMilestone;

/// <summary>
/// A dated moment that is neither a job nor a project — graduating, a talk, an award, a
/// move. The punctuation of the timeline.
/// </summary>
public sealed record SaveMilestoneCommand(
    Guid? Id,
    string Title,
    string Description,
    DateOnly Date,
    DateOnly? EndDate,
    MilestoneCategory Category,
    string? Link,
    int SortOrder) : IRequest<Guid>;

public sealed class SaveMilestoneCommandValidator : AbstractValidator<SaveMilestoneCommand>
{
    public SaveMilestoneCommandValidator()
    {
        RuleFor(c => c.Title).NotEmpty().MaximumLength(200);
        RuleFor(c => c.Description).MaximumLength(600);
        RuleFor(c => c.Category).IsInEnum();

        RuleFor(c => c.EndDate)
            .GreaterThanOrEqualTo(c => c.Date)
            .When(c => c.EndDate.HasValue)
            .WithMessage("The end cannot come before the start. Leave it empty for a single-day milestone.");

        RuleFor(c => c.Link)
            .Must(Urls.IsAbsoluteHttp)
            .When(c => !string.IsNullOrWhiteSpace(c.Link))
            .WithMessage("Must be a full http(s) address.");
    }
}

public sealed class SaveMilestoneCommandHandler(
    IChronicleDbContext db,
    IContentCacheInvalidator cache) : IRequestHandler<SaveMilestoneCommand, Guid>
{
    public async Task<Guid> Handle(SaveMilestoneCommand request, CancellationToken cancellationToken)
    {
        Milestone milestone;

        if (request.Id is { } id)
        {
            milestone = await db.Milestones
                .FirstOrDefaultAsync(m => m.Id == id, cancellationToken)
                .ConfigureAwait(false)
                ?? throw new NotFoundException(nameof(Milestone), id);
        }
        else
        {
            milestone = new Milestone();
            db.Milestones.Add(milestone);
        }

        milestone.Title = request.Title.Trim();
        milestone.Description = request.Description.Trim();
        milestone.Date = request.Date;
        milestone.EndDate = request.EndDate;
        milestone.Category = request.Category;
        milestone.Link = string.IsNullOrWhiteSpace(request.Link) ? null : request.Link.Trim();
        milestone.SortOrder = request.SortOrder;

        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        await cache.EvictAsync(cancellationToken, CacheTags.Chronology).ConfigureAwait(false);

        return milestone.Id;
    }
}
