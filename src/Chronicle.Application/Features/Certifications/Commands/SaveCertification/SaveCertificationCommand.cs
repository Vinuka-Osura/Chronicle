using Chronicle.Application.Common.Content;
using Chronicle.Application.Common.Exceptions;
using Chronicle.Application.Common.Interfaces;
using Chronicle.Domain.Entities;
using FluentValidation;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ValidationException = Chronicle.Application.Common.Exceptions.ValidationException;

namespace Chronicle.Application.Features.Certifications.Commands.SaveCertification;

/// <param name="Skills">
/// What the credential attests to, by skill name. These drive the link between a
/// certificate and the skills page, so they must already exist.
/// </param>
public sealed record SaveCertificationCommand(
    Guid? Id,
    string Name,
    string Issuer,
    DateOnly IssueDate,
    string? CredentialUrl,
    string? LogoUrl,
    int SortOrder,
    IReadOnlyList<string> Skills) : IRequest<Guid>;

public sealed class SaveCertificationCommandValidator : AbstractValidator<SaveCertificationCommand>
{
    public SaveCertificationCommandValidator()
    {
        RuleFor(c => c.Name).NotEmpty().MaximumLength(150);
        RuleFor(c => c.Issuer).NotEmpty().MaximumLength(100);

        RuleFor(c => c.CredentialUrl)
            .Must(Urls.IsAbsoluteHttp)
            .When(c => !string.IsNullOrWhiteSpace(c.CredentialUrl))
            .WithMessage("Must be a full http(s) address.");

        RuleFor(c => c.LogoUrl)
            .Must(Urls.IsAbsoluteHttp)
            .When(c => !string.IsNullOrWhiteSpace(c.LogoUrl))
            .WithMessage("Must be a full http(s) address.");
    }
}

public sealed class SaveCertificationCommandHandler(
    IChronicleDbContext db,
    IContentCacheInvalidator cache) : IRequestHandler<SaveCertificationCommand, Guid>
{
    public async Task<Guid> Handle(
        SaveCertificationCommand request,
        CancellationToken cancellationToken)
    {
        var (skills, unknown) = await Taxonomy
            .ResolveSkillsAsync(db, request.Skills, cancellationToken)
            .ConfigureAwait(false);

        if (unknown.Count > 0)
        {
            // Same rule as a project's tech stack: a skill carries years and a level that
            // only a person can set, so a typo must not quietly create one.
            throw new ValidationException(
            [
                new ValidationFailure(
                    nameof(SaveCertificationCommand.Skills),
                    $"Not a known skill: {string.Join(", ", unknown)}. Add it on the Skills page first.")
            ]);
        }

        Certification certification;

        if (request.Id is { } id)
        {
            certification = await db.Certifications
                .Include(c => c.Skills)
                .FirstOrDefaultAsync(c => c.Id == id, cancellationToken)
                .ConfigureAwait(false)
                ?? throw new NotFoundException(nameof(Certification), id);
        }
        else
        {
            certification = new Certification();
            db.Certifications.Add(certification);
        }

        certification.Name = request.Name.Trim();
        certification.Issuer = request.Issuer.Trim();
        certification.IssueDate = request.IssueDate;
        certification.CredentialUrl = Blank(request.CredentialUrl);
        certification.LogoUrl = Blank(request.LogoUrl);
        certification.SortOrder = request.SortOrder;

        certification.Skills.Clear();
        foreach (var skill in skills)
        {
            certification.Skills.Add(skill);
        }

        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        // Skills too: the skills page shows which credentials attest to each one.
        await cache.EvictAsync(cancellationToken, CacheTags.Certifications, CacheTags.Skills, CacheTags.ExternalStats)
            .ConfigureAwait(false);

        return certification.Id;
    }

    private static string? Blank(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
