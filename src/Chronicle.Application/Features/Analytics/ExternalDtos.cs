namespace Chronicle.Application.Features.Analytics;

/// <summary>
/// The non-GitHub half of the Analytics page.
/// </summary>
/// <remarks>
/// One payload rather than four endpoints. They are fetched together, cached together and
/// rendered on one page, and four round trips from the client to assemble one section would
/// be four chances for it to arrive half-drawn.
/// <para>
/// Every member is nullable and means the same thing when null: <b>that service is not set
/// up, or has nothing to show, so its section does not render.</b> A section that appears
/// with a zero in it reads as "this person has none", which is a different and usually
/// false claim.
/// </para>
/// </remarks>
public sealed record ExternalStatsDto(
    StackOverflowDto? StackOverflow,
    IReadOnlyList<CredentialBadgeDto> Badges,
    DockerHubDto? DockerHub,
    IReadOnlyList<ArticleLinkDto> Articles);

/// <param name="AcceptedRate">
/// Accepted over answered, or null when it could not be counted exactly. One of only three
/// figures on this page with a real denominator, and so one of the three allowed a ring.
/// </param>
public sealed record StackOverflowDto(
    string DisplayName,
    string ProfileUrl,
    int Reputation,
    int Answers,
    int Questions,
    double? AcceptedRate,
    int GoldBadges,
    int SilverBadges,
    int BronzeBadges,
    DateOnly MemberSince,
    IReadOnlyList<TagScoreDto> TopTags);

public sealed record TagScoreDto(string Name, int Score, int Posts);

/// <summary>
/// A credential badge, from Credly or from the CMS.
/// </summary>
/// <param name="Source">
/// <c>cms</c> or <c>credly</c>. Present so the page can say where a claim came from, and so
/// a reader can tell a self-entered line from a third-party-verifiable one.
/// </param>
public sealed record CredentialBadgeDto(
    string Name,
    string Issuer,
    string? Url,
    string? ImageUrl,
    DateOnly? IssuedAt,
    DateOnly? ExpiresAt,
    string Source);

public sealed record DockerHubDto(
    string Username,
    int Repositories,
    long TotalPulls,
    IReadOnlyList<DockerImageDto> Images);

public sealed record DockerImageDto(
    string Name,
    string? Description,
    long Pulls,
    int Stars,
    DateOnly LastUpdated,
    string Url);

/// <summary>An article published somewhere that is not this site.</summary>
public sealed record ArticleLinkDto(
    string Title,
    string Url,
    DateOnly PublishedAt,
    string? Summary,
    IReadOnlyList<string> Tags);
