using System.Globalization;
using Chronicle.Application.Common.Interfaces;
using Chronicle.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Ask.Queries.Ask;

/// <summary>
/// Answers questions about this engineer's work, from this engineer's own database.
/// </summary>
/// <remarks>
/// <para>
/// <b>There is no language model here, and that is the design rather than a shortfall.</b>
/// The spec deferred this as an "AI Copilot" on a free-tier model. Every free tier is a
/// quota with a card behind it, every hosted model is a per-question cost, and — the part
/// that actually decides it — a model asked "how long has he used PostgreSQL" will answer
/// even when it does not know. On a page whose entire purpose is to be believed about
/// somebody's career, a confident wrong answer is worse than no feature.
/// </para>
/// <para>
/// So this retrieves rather than generates. Every sentence it returns is assembled from
/// rows that are already on the site, and every answer carries the page it came from. It
/// cannot hallucinate a job, cannot invent a certification, costs nothing per question,
/// needs no key, and works with the network unplugged. What it gives up is small talk.
/// </para>
/// <para>
/// The matching is deliberately plain: normalise, score each intent by how many of its
/// cue words appear, take the best. No stemming, no embeddings. Ranked scoring rather
/// than first-match, because "what projects used PostgreSQL" contains cues for both
/// projects and skills and the more specific one has to win.
/// </para>
/// </remarks>
public sealed class AskQueryHandler(IChronicleDbContext db, IDateTimeProvider clock)
    : IRequestHandler<AskQuery, AskAnswerDto>
{
    /// <summary>
    /// Words too common to carry meaning; they would match every intent.
    /// </summary>
    /// <remarks>
    /// <b>Nothing here may also be an intent cue.</b> Noise is stripped before scoring, so
    /// a cue that appears in this set can never be matched — which is what made "who are
    /// you" fall through to the unknown answer while every other question worked. "who"
    /// and "about" were in both lists; they are cues, so they are not noise.
    /// </remarks>
    private static readonly HashSet<string> Noise = new(StringComparer.Ordinal)
    {
        "a", "an", "the", "is", "are", "was", "were", "do", "does", "did", "you",
        "your", "yours", "he", "his", "him", "i", "me", "my", "what", "which",
        "whom", "when", "why", "can", "could", "would", "should", "have",
        "has", "had", "any", "some", "of", "in", "on", "at", "to", "for", "with",
        "and", "or", "it", "its", "this", "that", "there", "tell", "show", "give", "us",
        "please", "know", "much", "many", "long", "been", "be", "am", "get", "got",
    };

    /// <summary>Openers. Matched before any intent, so hello is answered as hello.</summary>
    private static readonly HashSet<string> Greetings = new(StringComparer.Ordinal)
    {
        "hi", "hey", "hello", "yo", "greetings", "morning", "afternoon", "evening", "sup",
    };

    private static readonly HashSet<string> Thanks = new(StringComparer.Ordinal)
    {
        "thanks", "thank", "thankyou", "cheers", "appreciated", "ta",
    };

    public async Task<AskAnswerDto> Handle(AskQuery request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        var words = Tokenise(request.Question);

        // Ordered by specificity: the first intent whose score ties wins, so a question
        // naming a technology resolves to that technology rather than to "skills".
        var intents = new (string Name, string[] Cues, Func<CancellationToken, Task<Answer?>> Build)[]
        {
            ("contact", ["contact", "email", "reach", "hire", "hiring", "touch", "message", "mail"], ContactAsync),
            ("availability", ["available", "availability", "looking", "open", "job", "role", "opportunity"], AvailabilityAsync),
            ("experience", ["experience", "work", "worked", "working", "employer", "company", "job", "jobs", "role", "roles", "career", "years"], ExperienceAsync),
            // "study" and "studies" deliberately absent: they are the education question's
            // strongest cue, and having them here too meant "what did you study" tied and
            // resolved to whichever intent came first. "case" alone carries "case study".
            ("projects", ["project", "projects", "built", "build", "case", "portfolio", "shipped"], ProjectsAsync),
                        // "strongest" and "best" are here because the console offers "What is he
            // strongest at?" as a starter prompt, and it did not match — a suggested
            // question answering "I do not have that" is the worst possible first
            // impression of the feature. Every prompt the UI offers has been checked
            // against the live endpoint; none is covered by an automated test yet, and
            // that is the gap worth closing first if this grows.
            ("skills", ["skill", "skills", "tech", "technology", "technologies", "stack", "language", "languages", "framework", "frameworks", "use", "used", "using", "strongest", "strength", "strengths", "best", "expert", "specialise", "specialises", "speciality"], SkillsAsync),
            ("education", ["education", "degree", "university", "studied", "study", "school", "graduate", "graduated"], EducationAsync),
            ("certifications", ["certification", "certifications", "certified", "credential", "credentials", "badge", "badges", "exam"], CertificationsAsync),
            ("writing", ["article", "articles", "blog", "post", "posts", "write", "writes", "writing", "written", "journal"], WritingAsync),
            ("goals", ["goal", "goals", "next", "future", "plan", "plans", "roadmap", "learning", "learn"], GoalsAsync),
            ("location", ["location", "based", "live", "lives", "living", "city", "country", "remote", "relocate"], LocationAsync),
            ("who", ["who", "about", "yourself", "introduce", "summary", "bio"], WhoAsync),
        };

        /*
          Small talk first, and it is not decoration.

          Without it "hi" fell straight to the unknown answer — a flat "that is outside
          what this site holds" in response to hello, which is the one exchange that
          decides whether a visitor tries a second question. It is also the only place
          this thing is allowed to be warm without asserting anything.
        */
        if (words.Overlaps(Greetings))
        {
            return Render(request.Question, "greeting", new Answer(
                "Hello. Ask me anything about the work here — the roles, the projects, the "
                    + "stack, what he is learning, or how to reach him. I answer from what is "
                    + "actually on the site, so if I do not have something I will say so.",
                []));
        }

        if (words.Overlaps(Thanks))
        {
            return Render(request.Question, "thanks", new Answer(
                "Any time. Ask another if something else would help.", []));
        }

        // A named technology beats every general intent — "do you know Prisma" is a
        // question about Prisma, not a question about skills.
        var named = await NamedSkillAsync(words, cancellationToken).ConfigureAwait(false);
        if (named is not null) return Render(request.Question, "skill", named);

        var project = await NamedProjectAsync(request.Question, cancellationToken).ConfigureAwait(false);
        if (project is not null) return Render(request.Question, "project", project);

        var best = intents
            .Select(intent => (intent, score: intent.Cues.Count(words.Contains)))
            .Where(x => x.score > 0)
            .OrderByDescending(x => x.score)
            .Select(x => x.intent)
            .FirstOrDefault();

        if (best.Build is not null)
        {
            var answer = await best.Build(cancellationToken).ConfigureAwait(false);
            if (answer is not null) return Render(request.Question, best.Name, answer);
        }

        return Render(request.Question, "none", await UnknownAsync(cancellationToken).ConfigureAwait(false));
    }

    // ── Intent builders ──────────────────────────────────────────────────────────────

    private async Task<Answer?> WhoAsync(CancellationToken ct)
    {
        var profile = await db.Profiles.AsNoTracking().FirstOrDefaultAsync(ct).ConfigureAwait(false);
        if (profile is null) return null;

        return new Answer(
            $"{profile.FullName} — {profile.Headline}.\n\n{profile.Summary}",
            [new AskSourceDto("About", "/about"), new AskSourceDto("Résumé", "/resume")]);
    }

    private async Task<Answer?> ContactAsync(CancellationToken ct)
    {
        var profile = await db.Profiles.AsNoTracking().FirstOrDefaultAsync(ct).ConfigureAwait(false);
        if (profile is null) return null;

        var lines = new List<string>
        {
            $"The contact form here goes straight to {profile.FullName}, which is the surest "
                + "route. Otherwise:",
        };
        if (!string.IsNullOrWhiteSpace(profile.Email)) lines.Add($"Email: {profile.Email}");
        if (!string.IsNullOrWhiteSpace(profile.LinkedInUrl)) lines.Add($"LinkedIn: {profile.LinkedInUrl}");
        if (!string.IsNullOrWhiteSpace(profile.GitHubUrl)) lines.Add($"GitHub: {profile.GitHubUrl}");

        return new Answer(string.Join("\n", lines), [new AskSourceDto("Contact", "/contact")]);
    }

    private async Task<Answer?> AvailabilityAsync(CancellationToken ct)
    {
        var profile = await db.Profiles.AsNoTracking().FirstOrDefaultAsync(ct).ConfigureAwait(false);
        if (profile is null || string.IsNullOrWhiteSpace(profile.Availability)) return null;

        return new Answer(profile.Availability, [new AskSourceDto("Contact", "/contact")]);
    }

    private async Task<Answer?> LocationAsync(CancellationToken ct)
    {
        var profile = await db.Profiles.AsNoTracking().FirstOrDefaultAsync(ct).ConfigureAwait(false);
        if (profile is null || string.IsNullOrWhiteSpace(profile.Location)) return null;

        return new Answer($"Based in {profile.Location}.", [new AskSourceDto("Contact", "/contact")]);
    }

    private async Task<Answer?> ExperienceAsync(CancellationToken ct)
    {
        var roles = await db.Experiences.AsNoTracking()
            .OrderByDescending(e => e.StartDate)
            .Select(e => new { e.Role, e.Company, e.StartDate, e.EndDate })
            .ToListAsync(ct).ConfigureAwait(false);

        if (roles.Count == 0) return null;

        // Months actually worked, not "latest minus earliest" — overlapping or gapped
        // roles would both make that wrong.
        var months = roles.Sum(r => Months(r.StartDate, r.EndDate ?? Today()));
        var span = months >= 12
            ? $"{months / 12} year{(months / 12 == 1 ? "" : "s")}"
            : $"{months} month{(months == 1 ? "" : "s")}";

        var lines = roles.Select(r =>
            $"· {r.Role} at {r.Company} — {Month(r.StartDate)} to {(r.EndDate is { } e ? Month(e) : "now")}");

        return new Answer(
            $"He has held {roles.Count} role{(roles.Count == 1 ? "" : "s")}, about {span} in total.\n\n"
                + string.Join("\n", lines)
                + "\n\nThe timeline has the whole thing in order, if the shape of it is useful.",
            [new AskSourceDto("About", "/about"), new AskSourceDto("Timeline", "/timeline")]);
    }

    private async Task<Answer?> ProjectsAsync(CancellationToken ct)
    {
        var projects = await db.Projects.AsNoTracking()
            .OrderByDescending(p => p.Featured).ThenBy(p => p.SortOrder)
            .Select(p => new { p.Title, p.Slug, p.Pitch, p.Owner })
            .ToListAsync(ct).ConfigureAwait(false);

        if (projects.Count == 0) return null;

        var lines = projects.Select(p =>
            $"· {p.Title} — {p.Pitch}{(p.Owner is null ? "" : $" (for {p.Owner})")}");

        var sources = new List<AskSourceDto> { new("Projects", "/projects") };
        sources.AddRange(projects.Take(4).Select(p => new AskSourceDto(p.Title, $"/projects/{p.Slug}")));

        return new Answer(
            $"There {(projects.Count == 1 ? "is one case study" : $"are {projects.Count} case studies")} "
                + "here, each written problem-first rather than as a feature list:\n\n"
                + string.Join("\n", lines)
                + "\n\nAsk about any of them by name and I will go deeper.",
            sources);
    }

    private async Task<Answer?> SkillsAsync(CancellationToken ct)
    {
        var skills = await db.Skills.AsNoTracking()
            .OrderByDescending(s => s.Proficiency).ThenByDescending(s => s.YearsExperience)
            .Select(s => new { s.Name, s.Category, s.Proficiency, s.YearsExperience })
            .ToListAsync(ct).ConfigureAwait(false);

        if (skills.Count == 0) return null;

        var byCategory = skills
            .GroupBy(s => s.Category)
            .OrderByDescending(g => g.Count())
            .Select(g => $"· {g.Key}: {string.Join(", ", g.Take(6).Select(s => s.Name))}");

        return new Answer(
            $"He tracks {skills.Count} skills and is deliberately conservative about the levels. "
                + "The strongest are "
                + string.Join(", ", skills.Take(4).Select(s => $"{s.Name} ({s.Proficiency}, {Years(s.YearsExperience)})"))
                + ".\n\n" + string.Join("\n", byCategory),
            [new AskSourceDto("Skills", "/skills")]);
    }

    private async Task<Answer?> NamedSkillAsync(HashSet<string> words, CancellationToken ct)
    {
        if (words.Count == 0) return null;

        var skills = await db.Skills.AsNoTracking()
            .Select(s => new { s.Name, s.Category, s.Proficiency, s.YearsExperience })
            .ToListAsync(ct).ConfigureAwait(false);

        // Match on the skill's own tokens, so ".NET" is found by "net" and "ASP.NET Core"
        // by "asp" — the punctuation a visitor omits is the punctuation that breaks a
        // literal comparison.
        var hit = skills.FirstOrDefault(s => Tokenise(s.Name).Any(words.Contains));
        if (hit is null) return null;

        var used = await db.Projects.AsNoTracking()
            .Where(p => p.TechStack.Any(s => s.Name == hit.Name))
            .Select(p => new { p.Title, p.Slug })
            .ToListAsync(ct).ConfigureAwait(false);

        var roles = await db.Experiences.AsNoTracking()
            .Where(e => e.TechStack.Any(s => s.Name == hit.Name))
            .Select(e => new { e.Role, e.Company })
            .ToListAsync(ct).ConfigureAwait(false);

        var text = $"{hit.Name} — {hit.Proficiency}, {Years(hit.YearsExperience)} ({hit.Category}).";

        if (used.Count > 0)
        {
            text += $"\n\nUsed on {used.Count} project{(used.Count == 1 ? "" : "s")}: "
                + string.Join(", ", used.Select(p => p.Title)) + ".";
        }

        if (roles.Count > 0)
        {
            text += $"\n\nUsed in {roles.Count} role{(roles.Count == 1 ? "" : "s")}: "
                + string.Join(", ", roles.Select(r => $"{r.Role} at {r.Company}")) + ".";
        }

        if (used.Count == 0 && roles.Count == 0)
        {
            // Said plainly rather than omitted. A skill listed with nothing behind it is
            // exactly the claim a reader should be able to notice.
            text += "\n\nNo project or role on this site references it yet.";
        }

        var sources = new List<AskSourceDto> { new("Skills", "/skills") };
        sources.AddRange(used.Take(4).Select(p => new AskSourceDto(p.Title, $"/projects/{p.Slug}")));

        return new Answer(text, sources);
    }

    private async Task<Answer?> NamedProjectAsync(string question, CancellationToken ct)
    {
        var normalised = Normalise(question);

        var projects = await db.Projects.AsNoTracking()
            .Select(p => new { p.Title, p.Slug, p.Pitch, p.Problem, p.Owner, p.PermissionNote })
            .ToListAsync(ct).ConfigureAwait(false);

        // Whole title as a phrase, so "ticketing" alone does not pick between two
        // projects whose names differ only by a suffix.
        var hit = projects.FirstOrDefault(p => normalised.Contains(Normalise(p.Title), StringComparison.Ordinal));
        if (hit is null) return null;

        var text = $"{hit.Title} — {hit.Pitch}";
        if (hit.Owner is not null) text += $"\n\nBuilt for {hit.Owner}. {hit.PermissionNote}";
        text += $"\n\n{FirstSentences(hit.Problem, 2)}";

        return new Answer(text, [new AskSourceDto(hit.Title, $"/projects/{hit.Slug}")]);
    }

    private async Task<Answer?> EducationAsync(CancellationToken ct)
    {
        var education = await db.Milestones.AsNoTracking()
            .Where(m => m.Category == MilestoneCategory.Education)
            .OrderByDescending(m => m.Date)
            .Select(m => new { m.Title, m.Description, m.Date, m.EndDate })
            .ToListAsync(ct).ConfigureAwait(false);

        if (education.Count == 0) return null;

        var lines = education.Select(m =>
            $"· {m.Title} — {Month(m.Date)}{(m.EndDate is { } e ? $" to {Month(e)}" : "")}. {m.Description}");

        return new Answer(
            "Here is the education on record:\n\n" + string.Join("\n", lines),
            [new AskSourceDto("Timeline", "/timeline"), new AskSourceDto("Résumé", "/resume")]);
    }

    private async Task<Answer?> CertificationsAsync(CancellationToken ct)
    {
        var certs = await db.Certifications.AsNoTracking()
            .OrderByDescending(c => c.IssueDate)
            .Select(c => new { c.Name, c.Issuer, c.IssueDate, c.Kind })
            .ToListAsync(ct).ConfigureAwait(false);

        if (certs.Count == 0)
        {
            return new Answer(
                "None on the site yet — he has not added any. That is the real answer rather than "
                    + "an empty list dressed up as one.",
                [new AskSourceDto("About", "/about")]);
        }

        return new Answer(
            string.Join("\n", certs.Select(c => $"· {c.Name} — {c.Issuer}, {Month(c.IssueDate)} ({c.Kind})")),
            [new AskSourceDto("About", "/about")]);
    }

    private async Task<Answer?> WritingAsync(CancellationToken ct)
    {
        var posts = await db.Posts.AsNoTracking()
            .Where(p => p.IsPublished)
            .OrderByDescending(p => p.PublishedAt)
            .Select(p => new { p.Title, p.Slug, p.Excerpt, p.ExternalUrl })
            .ToListAsync(ct).ConfigureAwait(false);

        if (posts.Count == 0) return null;

        var sources = new List<AskSourceDto> { new("Knowledge", "/knowledge") };
        sources.AddRange(posts.Where(p => p.ExternalUrl == null).Take(4)
            .Select(p => new AskSourceDto(p.Title, $"/knowledge/{p.Slug}")));

        return new Answer(
            $"He has published {posts.Count} piece{(posts.Count == 1 ? "" : "s")} so far:\n\n"
                + string.Join("\n", posts.Take(6).Select(p => $"· {p.Title} — {p.Excerpt}")),
            sources);
    }

    private async Task<Answer?> GoalsAsync(CancellationToken ct)
    {
        var goals = await db.RoadmapItems.AsNoTracking()
            .OrderBy(r => r.TargetDate)
            .Select(r => new { r.Title, r.Description, r.TargetDate, r.Status })
            .ToListAsync(ct).ConfigureAwait(false);

        var learning = await db.LearningItems.AsNoTracking()
            .OrderBy(l => l.SortOrder)
            .Select(l => new { l.Topic, l.Status })
            .ToListAsync(ct).ConfigureAwait(false);

        if (goals.Count == 0 && learning.Count == 0) return null;

        var parts = new List<string>();

        if (learning.Count > 0)
        {
            parts.Add("Currently learning: "
                + string.Join(", ", learning.Select(l => $"{l.Topic} ({l.Status})")) + ".");
        }

        if (goals.Count > 0)
        {
            parts.Add("Stated goals — these are intentions, not achievements:\n"
                + string.Join("\n", goals.Select(g => $"· {g.Title} — {Month(g.TargetDate)} ({g.Status}). {g.Description}")));
        }

        return new Answer(string.Join("\n\n", parts),
            [new AskSourceDto("Timeline", "/timeline"), new AskSourceDto("Knowledge", "/knowledge")]);
    }

    /// <summary>What to say when nothing matched — which is a real outcome, not a failure.</summary>
    private async Task<Answer> UnknownAsync(CancellationToken ct)
    {
        var profile = await db.Profiles.AsNoTracking()
            .Select(p => p.FullName)
            .FirstOrDefaultAsync(ct).ConfigureAwait(false);

        var who = profile ?? "this engineer";

        return new Answer(
            "I do not have that one, sorry. I only answer from what is actually published here, "
                + $"and I would rather say so than guess about {who}'s career.\n\n"
                + "Things I can help with: his roles, the projects and how they were built, any "
                + "technology by name, his education, certifications, what he has written, what he "
                + "is learning next, and how to reach him.",
            [new AskSourceDto("About", "/about"), new AskSourceDto("Projects", "/projects")]);
    }

    // ── Assembly ─────────────────────────────────────────────────────────────────────

    private sealed record Answer(string Text, IReadOnlyList<AskSourceDto> Sources);

    private static AskAnswerDto Render(string question, string matched, Answer answer) =>
        new(question, answer.Text, answer.Sources, Suggestions(matched), matched);

    /// <summary>Follow-ups that move the reader somewhere they have not been.</summary>
    private static string[] Suggestions(string matched) => matched switch
    {
        "contact" or "availability" => ["What has he built?", "What is he strongest at?", "Where is he based?"],
        "experience" => ["What did he build there?", "What is he strongest at?", "How do I get in touch?"],
        "projects" or "project" => ["What technologies did he use?", "How long has he been working?", "How do I get in touch?"],
        "skills" or "skill" => ["What projects used it?", "What has he built?", "What is he learning next?"],
        "education" => ["What has he built?", "Does he have certifications?", "Where does he work?"],
        "certifications" => ["What is he learning next?", "What is he strongest at?", "What has he built?"],
        "writing" => ["What has he built?", "What is he learning next?", "How do I get in touch?"],
        "goals" => ["What has he built?", "What is he strongest at?", "How do I get in touch?"],
        _ => ["What has he built?", "Where has he worked?", "What is he strongest at?", "How do I get in touch?"],
    };

    // ── Text ─────────────────────────────────────────────────────────────────────────

    private static string Normalise(string value) =>
        new(value.ToLowerInvariant().Select(c => char.IsLetterOrDigit(c) ? c : ' ').ToArray());

    private static HashSet<string> Tokenise(string value) =>
        [.. Normalise(value).Split(' ', StringSplitOptions.RemoveEmptyEntries).Where(w => !Noise.Contains(w))];

    /*
      InvariantCulture, not "en-GB". `Directory.Build.props` sets
      `InvariantGlobalization`, so asking for a named culture throws
      CultureNotFoundException at runtime — which is exactly what happened: "where have
      you worked" and "what are your goals" both returned 500 while every other intent
      passed, because those two are the only ones that format a date.

      The invariant abbreviations are the ones wanted here anyway ("Aug 2026").
    */
    private static string Month(DateOnly date) =>
        date.ToString("MMM yyyy", CultureInfo.InvariantCulture);

    private static string Years(decimal value) =>
        $"{(value == Math.Floor(value) ? value.ToString("0", CultureInfo.InvariantCulture) : value.ToString("0.0", CultureInfo.InvariantCulture))} year{(value == 1 ? "" : "s")}";

    private static int Months(DateOnly from, DateOnly to) =>
        Math.Max(0, ((to.Year - from.Year) * 12) + to.Month - from.Month);

    /*
      A clock is needed for "to now" on an open role, and it comes from the injected
      provider rather than DateTime.UtcNow — this layer's rule, so the figure stays
      deterministic under test. An "about three years in total" that moves with the wall
      clock is precisely the kind of assertion worth being able to pin down.
    */
    private DateOnly Today() => clock.Today;

    private static string FirstSentences(string text, int count)
    {
        var sentences = text.Split('.', StringSplitOptions.RemoveEmptyEntries);
        return string.Join(". ", sentences.Take(count).Select(s => s.Trim())).TrimEnd('.') + ".";
    }
}
