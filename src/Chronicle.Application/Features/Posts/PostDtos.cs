namespace Chronicle.Application.Features.Posts;

/// <summary>Article card for the Knowledge Core list.</summary>
/// <param name="ExternalUrl">
/// Set when the article lives somewhere else. The card then links out instead of to
/// <c>/knowledge/{slug}</c>, and <c>ReadingTimeMinutes</c> means nothing because there is no
/// body here to have measured.
/// </param>
public sealed record PostCardDto(
    string Slug,
    string Title,
    string Excerpt,
    int ReadingTimeMinutes,
    DateTimeOffset? PublishedAt,
    IReadOnlyList<string> Tags,
    string? ExternalUrl,
    string? CoverImageUrl);

/// <summary>Full article. <c>BodyMarkdown</c> is raw; the client renders and sanitises it.</summary>
public sealed record PostDetailDto(
    string Slug,
    string Title,
    string Excerpt,
    string BodyMarkdown,
    int ReadingTimeMinutes,
    DateTimeOffset? PublishedAt,
    IReadOnlyList<string> Tags);
