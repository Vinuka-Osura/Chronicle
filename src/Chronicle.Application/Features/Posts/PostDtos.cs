namespace Chronicle.Application.Features.Posts;

/// <summary>Article card for the Knowledge Core list.</summary>
public sealed record PostCardDto(
    string Slug,
    string Title,
    string Excerpt,
    int ReadingTimeMinutes,
    DateTimeOffset? PublishedAt,
    IReadOnlyList<string> Tags);

/// <summary>Full article. <c>BodyMarkdown</c> is raw; the client renders and sanitises it.</summary>
public sealed record PostDetailDto(
    string Slug,
    string Title,
    string Excerpt,
    string BodyMarkdown,
    int ReadingTimeMinutes,
    DateTimeOffset? PublishedAt,
    IReadOnlyList<string> Tags);
