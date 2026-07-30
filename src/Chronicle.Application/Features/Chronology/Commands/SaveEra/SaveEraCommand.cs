using Chronicle.Application.Common.Exceptions;
using Chronicle.Application.Common.Interfaces;
using Chronicle.Domain.Entities;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Chronology.Commands.SaveEra;

/// <summary>
/// A named chapter of the timeline.
/// </summary>
/// <remarks>
/// Eras are editorial and cannot be derived: only a person can say where one chapter of
/// their life ended and the next began. Everything else on the timeline is sorted into
/// these by date, which is what turns a list of dated things into a story.
/// </remarks>
public sealed record SaveEraCommand(
    Guid? Id,
    string Name,
    string? Tagline,
    DateOnly StartDate,
    DateOnly? EndDate,
    int SortOrder) : IRequest<Guid>;

public sealed class SaveEraCommandValidator : AbstractValidator<SaveEraCommand>
{
    public SaveEraCommandValidator()
    {
        RuleFor(c => c.Name).NotEmpty().MaximumLength(100);
        RuleFor(c => c.Tagline).MaximumLength(200);

        RuleFor(c => c.EndDate)
            .GreaterThanOrEqualTo(c => c.StartDate)
            .When(c => c.EndDate.HasValue)
            .WithMessage("An era cannot end before it began. Leave the end empty if it is the current one.");
    }
}

public sealed class SaveEraCommandHandler(
    IChronicleDbContext db,
    IContentCacheInvalidator cache) : IRequestHandler<SaveEraCommand, Guid>
{
    public async Task<Guid> Handle(SaveEraCommand request, CancellationToken cancellationToken)
    {
        Era era;

        if (request.Id is { } id)
        {
            era = await db.Eras
                .FirstOrDefaultAsync(e => e.Id == id, cancellationToken)
                .ConfigureAwait(false)
                ?? throw new NotFoundException(nameof(Era), id);
        }
        else
        {
            era = new Era();
            db.Eras.Add(era);
        }

        era.Name = request.Name.Trim();
        era.Tagline = string.IsNullOrWhiteSpace(request.Tagline) ? null : request.Tagline.Trim();
        era.StartDate = request.StartDate;
        era.EndDate = request.EndDate;
        era.SortOrder = request.SortOrder;

        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        await cache.EvictAsync(cancellationToken, CacheTags.Chronology).ConfigureAwait(false);

        return era.Id;
    }
}
