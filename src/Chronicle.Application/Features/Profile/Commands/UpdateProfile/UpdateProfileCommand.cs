using Chronicle.Application.Common.Interfaces;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ProfileEntity = Chronicle.Domain.Entities.Profile;

namespace Chronicle.Application.Features.Profile.Commands.UpdateProfile;

/// <summary>The CV header, written in the CMS.</summary>
public sealed record UpdateProfileCommand(
    string FullName,
    string Headline,
    string Summary,
    string Email,
    string? Phone,
    string? Location,
    string? LinkedInUrl,
    string? GitHubUrl,
    string? WebsiteUrl,
    string? Availability) : IRequest;

public sealed class UpdateProfileCommandValidator : AbstractValidator<UpdateProfileCommand>
{
    public UpdateProfileCommandValidator()
    {
        RuleFor(c => c.FullName)
            .NotEmpty().WithMessage("The name is the first thing an applicant-tracking system looks for.")
            .MaximumLength(120);

        RuleFor(c => c.Headline)
            .NotEmpty().WithMessage("The line under the name is read as the job title. Leaving it blank leaves the title blank.")
            .MaximumLength(160);

        RuleFor(c => c.Summary)
            .NotEmpty().WithMessage("The summary is the only part of the CV most readers finish.")
            .MaximumLength(900).WithMessage("Four sentences at most — past that it stops being a summary and starts being the first page.");

        RuleFor(c => c.Email)
            .NotEmpty().WithMessage("A CV with no way to reply to it is a dead end.")
            .EmailAddress().WithMessage("That is not an address anyone can send to.")
            .MaximumLength(200);

        RuleFor(c => c.Phone).MaximumLength(40);
        RuleFor(c => c.Location).MaximumLength(120);
        RuleFor(c => c.Availability).MaximumLength(300);

        // Absolute URLs only, one rule each so the error comes back keyed to the field the
        // editor has to fix. A parser given "linkedin.com/in/x" resolves it against the
        // CV's own host and produces a dead link on someone else's desk.
        RuleFor(c => c.LinkedInUrl).MaximumLength(300)
            .Must(BeAbsoluteHttpUrl).WithMessage("The LinkedIn link needs the full https:// address.");

        RuleFor(c => c.GitHubUrl).MaximumLength(300)
            .Must(BeAbsoluteHttpUrl).WithMessage("The GitHub link needs the full https:// address.");

        RuleFor(c => c.WebsiteUrl).MaximumLength(300)
            .Must(BeAbsoluteHttpUrl).WithMessage("The website link needs the full https:// address.");
    }

    private static bool BeAbsoluteHttpUrl(string? value)
        => string.IsNullOrWhiteSpace(value)
            || (Uri.TryCreate(value, UriKind.Absolute, out var uri)
                && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps));
}

/// <remarks>
/// Creates the row if it is missing, for the same reason the status editor does: a
/// database seeded before the table existed should not leave the operator staring at a
/// save that fails for a row they cannot add.
/// </remarks>
public sealed class UpdateProfileCommandHandler(
    IChronicleDbContext db,
    IContentCacheInvalidator cache) : IRequestHandler<UpdateProfileCommand>
{
    public async Task Handle(UpdateProfileCommand request, CancellationToken cancellationToken)
    {
        var profile = await db.Profiles
            .FirstOrDefaultAsync(cancellationToken)
            .ConfigureAwait(false);

        if (profile is null)
        {
            profile = new ProfileEntity { Id = ProfileEntity.SingletonId };
            db.Profiles.Add(profile);
        }

        profile.FullName = request.FullName.Trim();
        profile.Headline = request.Headline.Trim();
        profile.Summary = request.Summary.Trim();
        profile.Email = request.Email.Trim();
        profile.Phone = Clean(request.Phone);
        profile.Location = Clean(request.Location);
        profile.LinkedInUrl = Clean(request.LinkedInUrl);
        profile.GitHubUrl = Clean(request.GitHubUrl);
        profile.WebsiteUrl = Clean(request.WebsiteUrl);
        profile.Availability = Clean(request.Availability);

        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        await cache.EvictAsync(cancellationToken, CacheTags.Profile).ConfigureAwait(false);
    }

    /// <summary>Empty and whitespace both mean "not set", so both become null.</summary>
    private static string? Clean(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
