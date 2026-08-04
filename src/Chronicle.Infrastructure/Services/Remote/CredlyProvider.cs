using System.Net.Http.Json;
using System.Text.Json;
using Chronicle.Application.Common.Models;
using Chronicle.Domain.Entities;

namespace Chronicle.Infrastructure.Services.Remote;

/// <summary>
/// Certification badges from a public Credly profile.
/// </summary>
/// <remarks>
/// <para>
/// <b>This endpoint is undocumented.</b> Credly's official API is issued to organisations;
/// an individual cannot get a key. <c>/users/{u}/badges.json</c> is the JSON view behind the
/// public profile page, and it can change or be withdrawn without notice — so every parse
/// here is defensive, a missing field is skipped rather than fatal, and the caller treats
/// an empty result as "no badges to show" and renders nothing.
/// </para>
/// <para>
/// Credly serves it without CORS headers, which is why browser-side code cannot use it.
/// Chronicle fetches everything server-side, so that restriction does not apply.
/// </para>
/// <para>
/// It is a supplement, never the source of record. The <c>Certification</c> entity in the
/// CMS is the spine; badges matched by name contribute only artwork. That matters because
/// Microsoft has been moving credential hosting onto Microsoft Learn, so Credly is a
/// decaying source for Microsoft specifically — a credential missing here must never mean a
/// credential missing from the site.
/// </para>
/// </remarks>
public sealed class CredlyProvider(HttpClient http) : IRemoteStatsProvider<CredlyBadges>
{
    public string Name => "credly";

    public string? Handle(Profile profile) => profile.CredlyUsername;

    public async Task<CredlyBadges?> FetchAsync(string handle, CancellationToken cancellationToken)
    {
        var document = await http
            .GetFromJsonAsync<JsonDocument>(
                $"users/{Uri.EscapeDataString(handle)}/badges.json",
                cancellationToken)
            .ConfigureAwait(false);

        if (document is null)
        {
            return null;
        }

        using (document)
        {
            if (!document.RootElement.TryGetProperty("data", out var data)
                || data.ValueKind is not JsonValueKind.Array)
            {
                // A shape we do not recognise. Empty rather than null: null would mean "no
                // answer" and keep retrying every request; this is an answer we cannot read,
                // and the section simply does not render.
                return new CredlyBadges();
            }

            var badges = new List<CredlyBadge>();

            foreach (var entry in data.EnumerateArray())
            {
                if (!entry.TryGetProperty("badge_template", out var template)
                    || template.ValueKind is not JsonValueKind.Object)
                {
                    continue;
                }

                var name = String(template, "name");
                if (string.IsNullOrWhiteSpace(name))
                {
                    continue;
                }

                badges.Add(new CredlyBadge(
                    Name: name,
                    Issuer: Issuer(template),
                    Url: String(entry, "id") is { Length: > 0 } id
                        ? $"https://www.credly.com/badges/{id}"
                        : $"https://www.credly.com/users/{handle}/badges",
                    ImageUrl: String(template, "image_url"),
                    IssuedAt: Date(entry, "issued_at"),
                    ExpiresAt: Date(entry, "expires_at")));
            }

            // Most recent first, undated last — an undated badge is almost always a data
            // gap on Credly's side rather than something genuinely ancient.
            return new CredlyBadges(
                [.. badges.OrderByDescending(b => b.IssuedAt ?? DateTimeOffset.MinValue)]);
        }
    }

    /// <summary>
    /// The issuing organisation, which Credly nests two levels deep inside an array.
    /// </summary>
    /// <remarks>
    /// The shape is <c>issuer.entities[0].entity.name</c>. Every step is checked because
    /// this is exactly the sort of nesting an undocumented endpoint reorganises.
    /// </remarks>
    private static string Issuer(JsonElement template)
    {
        if (template.TryGetProperty("issuer", out var issuer)
            && issuer.TryGetProperty("entities", out var entities)
            && entities.ValueKind is JsonValueKind.Array)
        {
            foreach (var wrapper in entities.EnumerateArray())
            {
                if (wrapper.TryGetProperty("entity", out var entity)
                    && String(entity, "name") is { Length: > 0 } name)
                {
                    return name;
                }
            }
        }

        return "Credly";
    }

    private static string? String(JsonElement element, string property) =>
        element.TryGetProperty(property, out var value) && value.ValueKind is JsonValueKind.String
            ? value.GetString()
            : null;

    private static DateTimeOffset? Date(JsonElement element, string property) =>
        String(element, property) is { } text && DateTimeOffset.TryParse(text, out var parsed)
            ? parsed
            : null;
}
