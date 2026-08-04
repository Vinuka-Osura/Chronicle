namespace Chronicle.Application.Common.Models;

/*
  The cached shapes for the non-GitHub services.

  Every collection is a nullable positional parameter with a null default, shadowed by an
  init property that normalises to an empty list. This is the same discipline GitHubStats
  documents and it exists for the same reason: these are stored as JSON in one row, so a
  payload written before a field existed must deserialise into a record that simply carries
  less. A required member would make every previously-cached payload throw instead.
*/

// ── Stack Overflow ──────────────────────────────────────────────────────────────

/// <param name="AcceptedAnswers">
/// Null when it could not be counted exactly. The accepted-answer rate is only honest over
/// the complete set of answers, so a truncated page yields null rather than a rate computed
/// from a sample and presented as the whole.
/// </param>
public sealed record StackOverflowStats(
    string DisplayName,
    string ProfileUrl,
    int Reputation,
    int Answers,
    int? AcceptedAnswers,
    int Questions,
    int GoldBadges,
    int SilverBadges,
    int BronzeBadges,
    DateTimeOffset MemberSince,
    IReadOnlyList<TagScore>? TopTags = null)
{
    public IReadOnlyList<TagScore> TopTags { get; init; } = TopTags ?? [];

    /// <summary>Accepted over answered, or null when either side is unknown or zero.</summary>
    /// <remarks>
    /// One of only three figures on the Analytics page with a real denominator, and
    /// therefore one of the three allowed a proportional form.
    /// </remarks>
    public double? AcceptedRate =>
        AcceptedAnswers is { } accepted && Answers > 0 ? (double)accepted / Answers : null;
}

/// <param name="Score">Net score across answers carrying this tag — the reason it ranks.</param>
public sealed record TagScore(string Name, int Score, int Posts);

// ── Credly ──────────────────────────────────────────────────────────────────────

public sealed record CredlyBadges(IReadOnlyList<CredlyBadge>? Badges = null)
{
    public IReadOnlyList<CredlyBadge> Badges { get; init; } = Badges ?? [];
}

/// <param name="Url">
/// The public verification page. This is the whole value of a badge over a typed-in line:
/// a reader can click it and confirm the claim without taking anyone's word.
/// </param>
public sealed record CredlyBadge(
    string Name,
    string Issuer,
    string Url,
    string? ImageUrl,
    DateTimeOffset? IssuedAt,
    DateTimeOffset? ExpiresAt);

// ── Docker Hub ──────────────────────────────────────────────────────────────────

public sealed record DockerHubStats(
    int Repositories,
    long TotalPulls,
    IReadOnlyList<DockerImage>? Images = null)
{
    public IReadOnlyList<DockerImage> Images { get; init; } = Images ?? [];
}

/// <param name="Pulls">
/// A bare count with no denominator. It gets a number and never a bar — nothing here says
/// what a pull is a proportion of.
/// </param>
public sealed record DockerImage(
    string Name,
    string? Description,
    long Pulls,
    int Stars,
    DateTimeOffset LastUpdated,
    string Url);

// ── Medium ──────────────────────────────────────────────────────────────────────

public sealed record MediumFeed(IReadOnlyList<MediumArticle>? Articles = null)
{
    public IReadOnlyList<MediumArticle> Articles { get; init; } = Articles ?? [];
}

/// <remarks>
/// Claps, views and reads are deliberately absent: Medium exposes them only through its
/// internal systems, and there is no free, official way to read them. What the public feed
/// carries is what is here.
/// </remarks>
public sealed record MediumArticle(
    string Title,
    string Url,
    DateTimeOffset PublishedAt,
    string? Summary,
    IReadOnlyList<string>? Tags = null,
    string? ImageUrl = null)
{
    public IReadOnlyList<string> Tags { get; init; } = Tags ?? [];
}
