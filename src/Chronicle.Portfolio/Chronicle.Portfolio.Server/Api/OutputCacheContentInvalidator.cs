using Chronicle.Application.Common.Interfaces;
using Microsoft.AspNetCore.OutputCaching;

namespace Chronicle.Portfolio.Server.Api;

/// <summary>
/// Evicts tagged output-cache entries so a CMS edit is visible on the next request
/// rather than after the TTL expires.
/// </summary>
/// <remarks>
/// This adapter is what keeps the "content is data, not code" promise honest: without
/// it, an editor saves a change, reloads the public page, still sees the old content,
/// and has no way to tell whether the save worked or the cache is simply stale.
/// </remarks>
internal sealed class OutputCacheContentInvalidator(IOutputCacheStore store) : IContentCacheInvalidator
{
    public async Task EvictAsync(CancellationToken cancellationToken = default, params string[] tags)
    {
        ArgumentNullException.ThrowIfNull(tags);

        foreach (var tag in tags)
        {
            await store.EvictByTagAsync(tag, cancellationToken).ConfigureAwait(false);
        }
    }
}
