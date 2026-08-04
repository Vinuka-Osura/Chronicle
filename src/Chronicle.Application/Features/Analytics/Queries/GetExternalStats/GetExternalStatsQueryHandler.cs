using Chronicle.Application.Common.Interfaces;
using Chronicle.Application.Common.Models;
using Chronicle.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Analytics.Queries.GetExternalStats;

/// <summary>
/// Stack Overflow, credentials, Docker Hub and Medium, merged for one page.
/// </summary>
/// <remarks>
/// Every source is independent and every one of them may be absent. Nothing here throws and
/// nothing here substitutes a zero for a missing answer — an absent service yields null and
/// its section is simply not rendered.
/// </remarks>
public sealed class GetExternalStatsQueryHandler(
    IRemoteStats<StackOverflowStats> stackOverflow,
    IRemoteStats<CredlyBadges> credly,
    IRemoteStats<DockerHubStats> dockerHub,
    IRemoteStats<MediumFeed> medium,
    IChronicleDbContext db) : IRequestHandler<GetExternalStatsQuery, ExternalStatsDto>
{
    public async Task<ExternalStatsDto> Handle(
        GetExternalStatsQuery request,
        CancellationToken cancellationToken)
    {
        var so = await stackOverflow.GetAsync(cancellationToken).ConfigureAwait(false);
        var badges = await credly.GetAsync(cancellationToken).ConfigureAwait(false);
        var docker = await dockerHub.GetAsync(cancellationToken).ConfigureAwait(false);
        var feed = await medium.GetAsync(cancellationToken).ConfigureAwait(false);

        var profile = await db.Profiles
            .AsNoTracking()
            .Select(p => p.DockerHubUsername)
            .FirstOrDefaultAsync(cancellationToken)
            .ConfigureAwait(false);

        var credentials = await MergeCredentialsAsync(badges, cancellationToken).ConfigureAwait(false);

        return new ExternalStatsDto(
            StackOverflow: Map(so),
            Badges: credentials,
            DockerHub: docker is null || docker.Images.Count == 0
                ? null
                : new DockerHubDto(
                    profile ?? string.Empty,
                    docker.Repositories,
                    docker.TotalPulls,
                    [.. docker.Images.Select(image => new DockerImageDto(
                        image.Name,
                        image.Description,
                        image.Pulls,
                        image.Stars,
                        DateOnly.FromDateTime(image.LastUpdated.UtcDateTime),
                        image.Url))]),
            Articles: feed is null
                ? []
                : [.. feed.Articles.Select(article => new ArticleLinkDto(
                    article.Title,
                    article.Url,
                    DateOnly.FromDateTime(article.PublishedAt.UtcDateTime),
                    article.Summary,
                    article.Tags))]);
    }

    private static StackOverflowDto? Map(StackOverflowStats? stats)
    {
        // Reputation 1 and no answers is what a brand-new account looks like. Rendering it
        // is worse than rendering nothing, so a profile with no contributions at all is
        // treated as nothing to show.
        if (stats is null || (stats.Answers == 0 && stats.Questions == 0))
        {
            return null;
        }

        return new StackOverflowDto(
            stats.DisplayName,
            stats.ProfileUrl,
            stats.Reputation,
            stats.Answers,
            stats.Questions,
            stats.AcceptedRate,
            stats.GoldBadges,
            stats.SilverBadges,
            stats.BronzeBadges,
            DateOnly.FromDateTime(stats.MemberSince.UtcDateTime),
            [.. stats.TopTags.Select(tag => new TagScoreDto(tag.Name, tag.Score, tag.Posts))]);
    }

    /// <summary>
    /// Credentials from the CMS, enriched with Credly artwork, plus any Credly badge the CMS
    /// does not know about.
    /// </summary>
    /// <remarks>
    /// <para>
    /// <b>The CMS wins.</b> Where both know a credential, the stored row supplies every fact
    /// — name, issuer, dates, link — and Credly contributes only an image. That ordering is
    /// the whole reason this is safe to depend on: Credly is an undocumented endpoint and a
    /// decaying source for Microsoft credentials specifically, so it must never be able to
    /// change what the site claims, only how it looks.
    /// </para>
    /// <para>
    /// Matching is on a normalised name. Imperfect, but the failure mode is a duplicate
    /// entry rather than a wrong one, and a duplicate is visible.
    /// </para>
    /// </remarks>
    private async Task<IReadOnlyList<CredentialBadgeDto>> MergeCredentialsAsync(
        CredlyBadges? badges,
        CancellationToken cancellationToken)
    {
        var stored = await db.Certifications
            .AsNoTracking()
            .OrderBy(c => c.Kind)
            .ThenByDescending(c => c.IssueDate)
            .Select(c => new
            {
                c.Name,
                c.Issuer,
                c.CredentialUrl,
                c.LogoUrl,
                c.IssueDate,
                c.ExpiryDate,
                c.Kind,
            })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var fromCredly = (badges?.Badges ?? [])
            .GroupBy(b => Normalise(b.Name))
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.Ordinal);

        var merged = new List<CredentialBadgeDto>(stored.Count + fromCredly.Count);
        var claimed = new HashSet<string>(StringComparer.Ordinal);

        foreach (var row in stored)
        {
            var key = Normalise(row.Name);
            claimed.Add(key);

            fromCredly.TryGetValue(key, out var badge);

            merged.Add(new CredentialBadgeDto(
                row.Name,
                row.Issuer,
                row.CredentialUrl ?? badge?.Url,
                row.LogoUrl ?? badge?.ImageUrl,
                row.IssueDate,
                row.ExpiryDate,
                Source: "cms"));
        }

        // Badges the CMS has never heard of, appended rather than dropped: a credential
        // earned last week and not yet typed in is still a credential.
        foreach (var (key, badge) in fromCredly)
        {
            if (claimed.Contains(key))
            {
                continue;
            }

            merged.Add(new CredentialBadgeDto(
                badge.Name,
                badge.Issuer,
                badge.Url,
                badge.ImageUrl,
                badge.IssuedAt is { } issued ? DateOnly.FromDateTime(issued.UtcDateTime) : null,
                badge.ExpiresAt is { } expires ? DateOnly.FromDateTime(expires.UtcDateTime) : null,
                Source: "credly"));
        }

        return merged;
    }

    /// <summary>Case and punctuation folded, so "AZ-900" and "az 900" are one credential.</summary>
    private static string Normalise(string name) =>
        new([.. name.Where(char.IsLetterOrDigit).Select(char.ToLowerInvariant)]);
}
