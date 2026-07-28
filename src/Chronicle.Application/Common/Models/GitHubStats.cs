namespace Chronicle.Application.Common.Models;

/// <summary>Shaped GitHub metrics backing the Analytics page and Mission Control strip.</summary>
public sealed record GitHubStats(
    int TotalCommits,
    int PublicRepos,
    int CurrentStreakDays,
    IReadOnlyList<ContributionDay> ContributionCalendar,
    IReadOnlyList<LanguageShare> TopLanguages,
    LastCommit? LastCommit,
    DateTimeOffset FetchedAt)
{
    /// <summary>Served when GitHub has never been reached, so the UI has something honest to render.</summary>
    public static GitHubStats Empty(DateTimeOffset fetchedAt) =>
        new(0, 0, 0, [], [], null, fetchedAt);
}

public sealed record ContributionDay(DateOnly Date, int Count);

public sealed record LanguageShare(string Name, double Percent);

public sealed record LastCommit(string Message, string Repo, DateTimeOffset When);
