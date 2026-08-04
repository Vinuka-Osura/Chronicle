using System.Net.Http.Json;
using System.Text.Json;
using Chronicle.Application.Common.Models;
using Chronicle.Domain.Entities;

namespace Chronicle.Infrastructure.Services.Remote;

/// <summary>
/// Published images and their pull counts from Docker Hub.
/// </summary>
/// <remarks>
/// <para>
/// One unauthenticated request. The widely-quoted Docker Hub rate limits — ten pulls an
/// hour for anonymous users — apply to <i>pulling images</i>, not to reading repository
/// metadata, which is what this does.
/// </para>
/// <para>
/// <b>Pull counts are bare counts.</b> Nothing here says what a pull is a proportion of, so
/// they get numbers and never bars. A pull is also not a user: CI systems pull the same
/// image thousands of times, which is why the page states the figure and does not build an
/// argument on it.
/// </para>
/// </remarks>
public sealed class DockerHubProvider(HttpClient http) : IRemoteStatsProvider<DockerHubStats>
{
    public string Name => "dockerhub";

    public string? Handle(Profile profile) => profile.DockerHubUsername;

    public async Task<DockerHubStats?> FetchAsync(string handle, CancellationToken cancellationToken)
    {
        var user = Uri.EscapeDataString(handle);

        var document = await http
            .GetFromJsonAsync<JsonDocument>(
                $"v2/repositories/{user}/?page_size=100&ordering=-pull_count",
                cancellationToken)
            .ConfigureAwait(false);

        if (document is null)
        {
            return null;
        }

        using (document)
        {
            if (!document.RootElement.TryGetProperty("results", out var results)
                || results.ValueKind is not JsonValueKind.Array)
            {
                return new DockerHubStats(0, 0);
            }

            var images = new List<DockerImage>();

            foreach (var entry in results.EnumerateArray())
            {
                var name = String(entry, "name");
                if (string.IsNullOrWhiteSpace(name))
                {
                    continue;
                }

                images.Add(new DockerImage(
                    Name: name,
                    Description: String(entry, "description") is { Length: > 0 } description
                        ? description
                        : null,
                    Pulls: Long(entry, "pull_count"),
                    Stars: (int)Long(entry, "star_count"),
                    LastUpdated: Date(entry, "last_updated") ?? DateTimeOffset.UnixEpoch,
                    Url: $"https://hub.docker.com/r/{handle}/{name}"));
            }

            return new DockerHubStats(
                // The API's own count, not the page length — it is the total across all
                // pages, and taking the first hundred would understate a prolific account.
                Repositories: (int)Long(document.RootElement, "count"),
                TotalPulls: images.Sum(image => image.Pulls),
                Images: images);
        }
    }

    private static string? String(JsonElement element, string property) =>
        element.TryGetProperty(property, out var value) && value.ValueKind is JsonValueKind.String
            ? value.GetString()
            : null;

    private static long Long(JsonElement element, string property) =>
        element.TryGetProperty(property, out var value) && value.ValueKind is JsonValueKind.Number
            ? value.GetInt64()
            : 0;

    private static DateTimeOffset? Date(JsonElement element, string property) =>
        String(element, property) is { } text && DateTimeOffset.TryParse(text, out var parsed)
            ? parsed
            : null;
}
