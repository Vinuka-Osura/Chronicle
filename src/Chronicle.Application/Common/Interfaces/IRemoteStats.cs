namespace Chronicle.Application.Common.Interfaces;

/// <summary>
/// Cached data from one external service, whichever service that is.
/// </summary>
/// <remarks>
/// <para>
/// Generic rather than one port per service. <see cref="IGitHubService"/> is the shape this
/// replaces: a bespoke interface per provider meant a bespoke everything per provider, and
/// four more of those was the cost that made adding four sources unaffordable.
/// </para>
/// <para>
/// <b>Never throws.</b> An unreachable service returns the previous payload, and a service
/// that has never answered returns null. A handler built on this does not need a try/catch
/// and a page built on it does not need an error state — only an absent one.
/// </para>
/// </remarks>
/// <typeparam name="TPayload">The service's cached shape, from <c>Common.Models</c>.</typeparam>
public interface IRemoteStats<TPayload>
    where TPayload : class
{
    /// <summary>
    /// The cached payload, refreshing it first if it is stale.
    /// </summary>
    /// <returns>
    /// Null when the service has never answered — including when it is not configured at
    /// all, which is the normal state for a service the owner does not use.
    /// </returns>
    Task<TPayload?> GetAsync(CancellationToken cancellationToken = default);
}
