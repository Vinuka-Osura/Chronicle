namespace Chronicle.Application.Features.Ask;

/// <summary>Where an answer came from, so the reader can go and check it.</summary>
/// <param name="Label">What to call the link — a page name or a project title.</param>
/// <param name="Path">A site-relative path, never an absolute URL.</param>
public sealed record AskSourceDto(string Label, string Path);

/// <summary>
/// An answer to a visitor's question, assembled from this site's own content.
/// </summary>
/// <param name="Answer">
/// Plain prose. Markdown is deliberately not used: the client renders this as text, and a
/// answer that can carry markup is an answer that can carry injected markup.
/// </param>
/// <param name="Sources">
/// The pages the answer was built from. Always at least one when <paramref name="Matched"/>
/// is not <c>none</c> — an assertion about someone's career with nowhere to verify it is
/// the thing this feature exists to avoid.
/// </param>
/// <param name="Suggestions">
/// What to ask next. A blank prompt is the hardest interface to start using, and these are
/// derived from what the site actually holds rather than being a fixed list.
/// </param>
/// <param name="Matched">
/// Which intent answered, or <c>none</c>. Exposed rather than hidden because it is the
/// honest thing for a portfolio to show about its own machinery.
/// </param>
public sealed record AskAnswerDto(
    string Question,
    string Answer,
    IReadOnlyList<AskSourceDto> Sources,
    IReadOnlyList<string> Suggestions,
    string Matched);
