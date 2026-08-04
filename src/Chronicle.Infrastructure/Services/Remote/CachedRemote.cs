using System.Collections.Concurrent;
using System.Text.Json;
using Chronicle.Application.Common.Interfaces;
using Chronicle.Domain.Entities;
using Chronicle.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Chronicle.Infrastructure.Services.Remote;

/// <summary>
/// Fetch-once-every-few-hours, serve-from-the-database-in-between, for any external service.
/// </summary>
/// <remarks>
/// <para>
/// The algorithm is lifted from <c>GitHubService</c> rather than reinvented — it had
/// already been got right, and the parts that look redundant are each load-bearing:
/// </para>
/// <list type="bullet">
/// <item>
/// The staleness check happens twice: once outside the gate so the common case never
/// contends, and once inside it so a queue of requests behind one refresh does not each
/// perform their own.
/// </item>
/// <item>
/// The re-check inside the gate calls <c>ReloadAsync</c> on a tracked entity rather than
/// re-querying. EF's identity map would hand back the same stale instance and the
/// double-check would always agree with itself.
/// </item>
/// <item>
/// <b>A failed fetch does not stamp <c>FetchedAt</c>.</b> Leaving the row stale means the
/// next request retries, instead of a single bad minute costing a full refresh interval.
/// </item>
/// <item>
/// The catch is narrow — transport and parsing only. A bug in a provider should surface as
/// a bug, not as an empty page.
/// </item>
/// </list>
/// <para>
/// **This never throws at the caller.** A page built on it degrades to its previous answer,
/// or to nothing, and says so — which is the behaviour every consumer already assumes.
/// </para>
/// </remarks>
public sealed class CachedRemote<TPayload>(
    IRemoteStatsProvider<TPayload> provider,
    ChronicleDbContext db,
    IDateTimeProvider clock,
    IOptions<RemoteCacheOptions> options,
    ILogger<CachedRemote<TPayload>> logger) : IRemoteStats<TPayload>
    where TPayload : class
{
    /// <summary>
    /// One gate per provider, shared process-wide.
    /// </summary>
    /// <remarks>
    /// Static because this class is resolved per request while the thing being protected —
    /// one row and one outbound call — is process-wide. Keyed by provider so a slow Medium
    /// feed cannot block a GitHub refresh.
    /// </remarks>
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> Gates = new();

    private static readonly JsonSerializerOptions PayloadJson = new(JsonSerializerDefaults.Web);

    private readonly TimeSpan _refreshInterval = options.Value.RefreshInterval;

    public async Task<TPayload?> GetAsync(CancellationToken cancellationToken = default)
    {
        var now = clock.UtcNow;

        var row = await db.ExternalStatsCaches
            .FirstOrDefaultAsync(c => c.Provider == provider.Name, cancellationToken)
            .ConfigureAwait(false);

        var cached = Deserialise(row);

        // No handle means the service was never set up. That is a supported state, not a
        // failure, and it costs no network call.
        var profile = await db.Profiles
            .AsNoTracking()
            .FirstOrDefaultAsync(cancellationToken)
            .ConfigureAwait(false);

        var handle = profile is null ? null : provider.Handle(profile);

        if (string.IsNullOrWhiteSpace(handle))
        {
            return cached;
        }

        if (cached is not null && row is not null && now - row.FetchedAt < _refreshInterval)
        {
            return cached;
        }

        var gate = Gates.GetOrAdd(provider.Name, _ => new SemaphoreSlim(1, 1));
        await gate.WaitAsync(cancellationToken).ConfigureAwait(false);

        try
        {
            // Re-check inside the gate. Reload rather than re-query when the entity is
            // tracked, or the identity map returns the copy we already have.
            if (row is not null)
            {
                await db.Entry(row).ReloadAsync(cancellationToken).ConfigureAwait(false);
            }
            else
            {
                row = await db.ExternalStatsCaches
                    .FirstOrDefaultAsync(c => c.Provider == provider.Name, cancellationToken)
                    .ConfigureAwait(false);
            }

            var recheck = Deserialise(row);

            if (recheck is not null && row is not null && clock.UtcNow - row.FetchedAt < _refreshInterval)
            {
                return recheck;
            }

            var fresh = await provider.FetchAsync(handle, cancellationToken).ConfigureAwait(false);

            if (fresh is null)
            {
                RemoteLog.FetchReturnedNothing(logger, provider.Name);
                return recheck ?? cached;
            }

            await StoreAsync(row, fresh, clock.UtcNow, cancellationToken).ConfigureAwait(false);
            return fresh;
        }
        // KeyNotFoundException sits with JsonException on purpose: both mean the remote
        // payload was not the shape expected, and which one you get depends only on whether
        // the provider used GetProperty or a parser. GitHubService lost a whole page to one
        // of these escaping.
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException
            or JsonException or KeyNotFoundException)
        {
            RemoteLog.RefreshFailed(logger, provider.Name, ex);
            return cached;
        }
        finally
        {
            gate.Release();
        }
    }

    /// <summary>
    /// The cached payload, or null when there has never been one.
    /// </summary>
    /// <remarks>
    /// <c>"{}"</c> is treated as absent — that is what a seeded row carries, and reading it
    /// as an empty result would mean the first request never refreshes. A payload written
    /// by an older shape of the record is also treated as absent rather than throwing, so a
    /// field rename degrades to one stale refresh instead of a broken page.
    /// </remarks>
    private static TPayload? Deserialise(ExternalStatsCache? row)
    {
        if (row is null || string.IsNullOrWhiteSpace(row.PayloadJson) || row.PayloadJson == "{}")
        {
            return null;
        }

        try
        {
            return JsonSerializer.Deserialize<TPayload>(row.PayloadJson, PayloadJson);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private async Task StoreAsync(
        ExternalStatsCache? row,
        TPayload payload,
        DateTimeOffset fetchedAt,
        CancellationToken cancellationToken)
    {
        var json = JsonSerializer.Serialize(payload, PayloadJson);

        if (row is null)
        {
            db.ExternalStatsCaches.Add(new ExternalStatsCache
            {
                Provider = provider.Name,
                PayloadJson = json,
                FetchedAt = fetchedAt,
            });
        }
        else
        {
            row.PayloadJson = json;
            row.FetchedAt = fetchedAt;
        }

        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}

/// <summary>How long a cached payload is considered current, for every provider.</summary>
/// <remarks>
/// Six hours. A contribution graph that lags by a morning is indistinguishable from a live
/// one to a reader, and at four refreshes a day every service here stays inside even its
/// unauthenticated quota with room to spare.
/// </remarks>
public sealed class RemoteCacheOptions
{
    public const string SectionName = "RemoteCache";

    public TimeSpan RefreshInterval { get; set; } = TimeSpan.FromHours(6);
}

internal static partial class RemoteLog
{
    [LoggerMessage(EventId = 3010, Level = LogLevel.Warning,
        Message = "{Provider} returned no data; serving the previous payload.")]
    public static partial void FetchReturnedNothing(ILogger logger, string provider);

    [LoggerMessage(EventId = 3011, Level = LogLevel.Warning,
        Message = "{Provider} refresh failed; serving the previous payload.")]
    public static partial void RefreshFailed(ILogger logger, string provider, Exception exception);
}
