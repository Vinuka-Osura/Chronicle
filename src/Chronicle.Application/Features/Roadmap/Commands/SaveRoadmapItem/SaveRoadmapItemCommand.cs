using Chronicle.Application.Common.Exceptions;
using Chronicle.Application.Common.Interfaces;
using Chronicle.Domain.Entities;
using Chronicle.Domain.Enums;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Roadmap.Commands.SaveRoadmapItem;

/// <summary>
/// A stated intention, rendered below the timeline's today marker.
/// </summary>
/// <remarks>
/// These are goals rather than achievements, and the public page says so. That framing
/// is what makes them worth stating at all — a roadmap presented as accomplishment is
/// just an inaccurate CV.
/// </remarks>
public sealed record SaveRoadmapItemCommand(
    Guid? Id,
    string Title,
    string Description,
    DateOnly TargetDate,
    RoadmapStatus Status,
    int SortOrder) : IRequest<Guid>;

public sealed class SaveRoadmapItemCommandValidator : AbstractValidator<SaveRoadmapItemCommand>
{
    public SaveRoadmapItemCommandValidator()
    {
        RuleFor(c => c.Title).NotEmpty().MaximumLength(200);
        RuleFor(c => c.Description).MaximumLength(600);
        RuleFor(c => c.Status).IsInEnum();
    }
}

public sealed class SaveRoadmapItemCommandHandler(
    IChronicleDbContext db,
    IContentCacheInvalidator cache) : IRequestHandler<SaveRoadmapItemCommand, Guid>
{
    public async Task<Guid> Handle(
        SaveRoadmapItemCommand request,
        CancellationToken cancellationToken)
    {
        RoadmapItem item;

        if (request.Id is { } id)
        {
            item = await db.RoadmapItems
                .FirstOrDefaultAsync(r => r.Id == id, cancellationToken)
                .ConfigureAwait(false)
                ?? throw new NotFoundException(nameof(RoadmapItem), id);
        }
        else
        {
            item = new RoadmapItem();
            db.RoadmapItems.Add(item);
        }

        item.Title = request.Title.Trim();
        item.Description = request.Description.Trim();
        item.TargetDate = request.TargetDate;
        item.Status = request.Status;
        item.SortOrder = request.SortOrder;

        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        // Chronology as well: roadmap items are drawn on the timeline past the today line.
        await cache.EvictAsync(cancellationToken, [CacheTags.Roadmap, .. CacheTags.Chronology])
            .ConfigureAwait(false);

        return item.Id;
    }
}
