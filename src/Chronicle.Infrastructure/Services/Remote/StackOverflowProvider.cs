using System.Net.Http.Json;
using System.Text.Json;
using Chronicle.Application.Common.Models;
using Chronicle.Domain.Entities;

namespace Chronicle.Infrastructure.Services.Remote;

/// <summary>
/// Reputation, answers and badges from the Stack Exchange API.
/// </summary>
/// <remarks>
/// <para>
/// No key and no account. The unauthenticated quota is 300 requests a day and this uses
/// three per refresh, four times a day — twelve. Registering an app would raise the quota
/// to 10,000, which would be solving a problem nobody has.
/// </para>
/// <para>
/// <b>Stack Exchange always responds gzipped</b>, whatever the request asks for, so the
/// handler for this client must enable automatic decompression. Without it every response
/// is binary and every parse fails — see the registration in <c>DependencyInjection</c>.
/// </para>
/// </remarks>
public sealed class StackOverflowProvider(HttpClient http) : IRemoteStatsProvider<StackOverflowStats>
{
    public string Name => "stackoverflow";

    public string? Handle(Profile profile) => profile.StackOverflowUserId;

    /// <summary>
    /// How many answers can be counted exactly before the rate is abandoned.
    /// </summary>
    /// <remarks>
    /// The API pages at 100. Beyond that, counting accepted answers would need several
    /// requests, and a rate computed from the first hundred and presented as the whole is
    /// the kind of quiet overstatement this codebase refuses elsewhere. Past this, the rate
    /// is null and the ring is not drawn.
    /// </remarks>
    private const int ExactAnswerLimit = 100;

    public async Task<StackOverflowStats?> FetchAsync(string handle, CancellationToken cancellationToken)
    {
        var id = Uri.EscapeDataString(handle);

        var user = await GetAsync($"users/{id}?site=stackoverflow", cancellationToken).ConfigureAwait(false);

        if (user is not { } profile)
        {
            return null;
        }

        var badges = profile.TryGetProperty("badge_counts", out var counts) ? counts : default;

        // `answer_count` and `question_count` are NOT in the default user filter, which is
        // the trap here: reading them off the user object yields zero for an account with
        // real activity, and the page then hides a profile that should be shown. The
        // built-in `total` filter on each collection is the documented way to get them and
        // costs one small request each.
        var answers = await GetTotalAsync($"users/{id}/answers?site=stackoverflow&filter=total", cancellationToken)
            .ConfigureAwait(false);

        var questions = await GetTotalAsync($"users/{id}/questions?site=stackoverflow&filter=total", cancellationToken)
            .ConfigureAwait(false);

        var tags = await GetItemsAsync(
                $"users/{id}/top-answer-tags?site=stackoverflow&pagesize=8",
                cancellationToken)
            .ConfigureAwait(false);

        var accepted = await CountAcceptedAsync(id, answers, cancellationToken).ConfigureAwait(false);

        return new StackOverflowStats(
            DisplayName: String(profile, "display_name") ?? "Stack Overflow",
            ProfileUrl: String(profile, "link") ?? $"https://stackoverflow.com/users/{handle}",
            Reputation: Int(profile, "reputation"),
            Answers: answers,
            AcceptedAnswers: accepted,
            Questions: questions,
            GoldBadges: badges.ValueKind is JsonValueKind.Object ? Int(badges, "gold") : 0,
            SilverBadges: badges.ValueKind is JsonValueKind.Object ? Int(badges, "silver") : 0,
            BronzeBadges: badges.ValueKind is JsonValueKind.Object ? Int(badges, "bronze") : 0,
            MemberSince: Unix(profile, "creation_date"),
            TopTags: [.. tags.Select(tag => new TagScore(
                String(tag, "tag_name") ?? "",
                Int(tag, "answer_score"),
                Int(tag, "answer_count")))]);
    }

    /// <summary>The `total` filter's one-field envelope: <c>{"total": 12}</c>.</summary>
    private async Task<int> GetTotalAsync(string path, CancellationToken cancellationToken)
    {
        var document = await http
            .GetFromJsonAsync<JsonDocument>(path, cancellationToken)
            .ConfigureAwait(false);

        if (document is null)
        {
            return 0;
        }

        using (document)
        {
            return Int(document.RootElement, "total");
        }
    }

    /// <summary>
    /// Accepted answers, or null when they cannot be counted exactly.
    /// </summary>
    /// <remarks>
    /// Null is a real answer here, not a failure: it means "we will not claim a rate we
    /// have not measured", and the page draws no ring rather than an approximate one.
    /// </remarks>
    private async Task<int?> CountAcceptedAsync(
        string id,
        int answerCount,
        CancellationToken cancellationToken)
    {
        if (answerCount == 0)
        {
            return 0;
        }

        if (answerCount > ExactAnswerLimit)
        {
            return null;
        }

        var answers = await GetItemsAsync(
                $"users/{id}/answers?site=stackoverflow&pagesize={ExactAnswerLimit}",
                cancellationToken)
            .ConfigureAwait(false);

        return answers.Count == 0
            ? null
            : answers.Count(a => a.TryGetProperty("is_accepted", out var flag)
                && flag.ValueKind is JsonValueKind.True);
    }

    // ── Transport ───────────────────────────────────────────────────────────────

    /// <summary>The first item of a Stack Exchange envelope, which always wraps in `items`.</summary>
    private async Task<JsonElement?> GetAsync(string path, CancellationToken cancellationToken)
    {
        var items = await GetItemsAsync(path, cancellationToken).ConfigureAwait(false);
        return items.Count > 0 ? items[0] : null;
    }

    private async Task<IReadOnlyList<JsonElement>> GetItemsAsync(
        string path,
        CancellationToken cancellationToken)
    {
        var document = await http
            .GetFromJsonAsync<JsonDocument>(path, cancellationToken)
            .ConfigureAwait(false);

        if (document is null || !document.RootElement.TryGetProperty("items", out var items))
        {
            return [];
        }

        // Cloned out of the document before it is disposed: a JsonElement is a view over
        // the document's buffer, and returning one from a disposed document hands the
        // caller a window onto memory already returned to the pool.
        var cloned = items.EnumerateArray().Select(item => item.Clone()).ToList();
        document.Dispose();
        return cloned;
    }

    private static string? String(JsonElement element, string property) =>
        element.TryGetProperty(property, out var value) && value.ValueKind is JsonValueKind.String
            ? value.GetString()
            : null;

    private static int Int(JsonElement element, string property) =>
        element.TryGetProperty(property, out var value) && value.ValueKind is JsonValueKind.Number
            ? value.GetInt32()
            : 0;

    /// <summary>Stack Exchange dates are Unix seconds.</summary>
    private static DateTimeOffset Unix(JsonElement element, string property) =>
        element.TryGetProperty(property, out var value) && value.ValueKind is JsonValueKind.Number
            ? DateTimeOffset.FromUnixTimeSeconds(value.GetInt64())
            : DateTimeOffset.UnixEpoch;
}
