namespace Chronicle.Application.Common.Models;

/// <summary>A grounded answer plus the content it was drawn from.</summary>
public sealed record CopilotAnswer(string Answer, IReadOnlyList<CopilotSource> Sources)
{
    /// <summary>
    /// Returned when the model is unavailable. The Copilot is an enhancement, so it
    /// degrades to a pointer rather than an error.
    /// </summary>
    public static CopilotAnswer Unavailable() => new(
        "I can't answer that right now. The projects and articles on this site cover the " +
        "same ground - try the Projects or Knowledge pages.",
        []);
}

public sealed record CopilotSource(string Title, string Url);
