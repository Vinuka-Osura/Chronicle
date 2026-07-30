namespace Chronicle.Application.Features.SiteStatus;

/// <summary>
/// The Mission Control status strip.
/// </summary>
/// <remarks>
/// Two halves with different lifecycles: <see cref="CurrentFocus"/> and
/// <see cref="Mood"/> are written by hand in the CMS, while <see cref="LastCommit"/>
/// comes from the cached GitHub payload. The GitHub half is nullable and stays null
/// until that integration lands — and if GitHub is unreachable it simply stays null
/// again, so the strip degrades to its editorial half rather than breaking the page.
/// </remarks>
public sealed record SiteStatusDto(
    string CurrentFocus,
    string? Mood,
    DateTimeOffset UpdatedAt,
    LastCommitDto? LastCommit);

public sealed record LastCommitDto(string Message, string Repo, DateTimeOffset When);
