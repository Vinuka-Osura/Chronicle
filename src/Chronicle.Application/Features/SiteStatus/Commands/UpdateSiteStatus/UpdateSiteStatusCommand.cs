using Chronicle.Application.Common.Interfaces;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using StatusEntity = Chronicle.Domain.Entities.SiteStatus;

namespace Chronicle.Application.Features.SiteStatus.Commands.UpdateSiteStatus;

/// <summary>The editorial half of the Mission Control strip.</summary>
public sealed record UpdateSiteStatusCommand(string CurrentFocus, string? Mood) : IRequest;

public sealed class UpdateSiteStatusCommandValidator : AbstractValidator<UpdateSiteStatusCommand>
{
    public UpdateSiteStatusCommandValidator()
    {
        RuleFor(c => c.CurrentFocus)
            .NotEmpty().WithMessage("The strip is the first thing on the home page; it needs something to say.")
            .MaximumLength(200);

        RuleFor(c => c.Mood).MaximumLength(100);
    }
}

/// <remarks>
/// Update, never insert-or-update from the caller's point of view: the row is a
/// singleton with a check constraint pinning its primary key, so there is exactly one
/// and this screen can only edit it. Creating it here covers the case of a database
/// seeded before the row existed, rather than failing the save over a missing row the
/// operator cannot do anything about.
/// </remarks>
public sealed class UpdateSiteStatusCommandHandler(
    IChronicleDbContext db,
    IContentCacheInvalidator cache) : IRequestHandler<UpdateSiteStatusCommand>
{
    public async Task Handle(UpdateSiteStatusCommand request, CancellationToken cancellationToken)
    {
        var status = await db.SiteStatuses
            .FirstOrDefaultAsync(cancellationToken)
            .ConfigureAwait(false);

        if (status is null)
        {
            status = new StatusEntity { Id = StatusEntity.SingletonId };
            db.SiteStatuses.Add(status);
        }

        status.CurrentFocus = request.CurrentFocus.Trim();
        status.Mood = string.IsNullOrWhiteSpace(request.Mood) ? null : request.Mood.Trim();

        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        await cache.EvictAsync(cancellationToken, CacheTags.Status).ConfigureAwait(false);
    }
}
