using Chronicle.Application.Common.Content;
using Chronicle.Application.Common.Exceptions;
using Chronicle.Application.Common.Interfaces;
using Chronicle.Domain.Entities;
using Chronicle.Domain.Enums;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Learning.Commands.SaveLearningItem;

public sealed record SaveLearningItemCommand(
    Guid? Id,
    string Topic,
    string Note,
    LearningStatus Status,
    int? ProgressPercent,
    string? Link,
    int SortOrder) : IRequest<Guid>;

public sealed class SaveLearningItemCommandValidator : AbstractValidator<SaveLearningItemCommand>
{
    public SaveLearningItemCommandValidator()
    {
        RuleFor(c => c.Topic).NotEmpty().MaximumLength(150);
        RuleFor(c => c.Note).MaximumLength(500);
        RuleFor(c => c.Status).IsInEnum();

        RuleFor(c => c.ProgressPercent)
            .InclusiveBetween(0, 100)
            .When(c => c.ProgressPercent.HasValue)
            .WithMessage("Progress is a percentage, so 0 to 100. Leave it empty if you would rather not say.");

        RuleFor(c => c.Link)
            .Must(Urls.IsAbsoluteHttp)
            .When(c => !string.IsNullOrWhiteSpace(c.Link))
            .WithMessage("Must be a full http(s) address.");
    }
}

public sealed class SaveLearningItemCommandHandler(
    IChronicleDbContext db,
    IContentCacheInvalidator cache) : IRequestHandler<SaveLearningItemCommand, Guid>
{
    public async Task<Guid> Handle(
        SaveLearningItemCommand request,
        CancellationToken cancellationToken)
    {
        LearningItem item;

        if (request.Id is { } id)
        {
            item = await db.LearningItems
                .FirstOrDefaultAsync(l => l.Id == id, cancellationToken)
                .ConfigureAwait(false)
                ?? throw new NotFoundException(nameof(LearningItem), id);
        }
        else
        {
            item = new LearningItem();
            db.LearningItems.Add(item);
        }

        item.Topic = request.Topic.Trim();
        item.Note = request.Note.Trim();
        item.Status = request.Status;
        item.ProgressPercent = request.ProgressPercent;
        item.Link = string.IsNullOrWhiteSpace(request.Link) ? null : request.Link.Trim();
        item.SortOrder = request.SortOrder;

        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        await cache.EvictAsync(cancellationToken, CacheTags.Learning).ConfigureAwait(false);

        return item.Id;
    }
}
