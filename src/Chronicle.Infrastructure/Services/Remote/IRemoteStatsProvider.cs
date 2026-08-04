using Chronicle.Domain.Entities;

namespace Chronicle.Infrastructure.Services.Remote;

/// <summary>
/// One external service Chronicle reads activity from.
/// </summary>
/// <remarks>
/// <para>
/// Deliberately narrow: a name, the handle it needs, and a fetch. Everything else — the
/// stampede gate, the staleness decision, storing the payload, and never throwing at the
/// caller — belongs to <see cref="CachedRemote{TPayload}"/> and is written once.
/// </para>
/// <para>
/// A provider may throw. <see cref="CachedRemote{TPayload}"/> catches the transport and
/// parsing failures and serves the previous payload, so an implementation should let a
/// genuine failure surface rather than swallowing it into an empty result — an empty
/// result gets cached, and a failure does not.
/// </para>
/// </remarks>
/// <typeparam name="TPayload">
/// The service's cached shape. Must tolerate being deserialised from a payload written
/// before its newest fields existed — see the nullable-default discipline on
/// <c>GitHubStats</c>.
/// </typeparam>
public interface IRemoteStatsProvider<TPayload>
    where TPayload : class
{
    /// <summary>
    /// Lowercase key for the cache row, e.g. <c>stackoverflow</c>. Stable for ever: change
    /// it and the service silently starts again from an empty cache.
    /// </summary>
    string Name { get; }

    /// <summary>
    /// The handle this provider needs, taken from the profile — or <see langword="null"/>
    /// when it is not set.
    /// </summary>
    /// <remarks>
    /// Null means unconfigured, which is a supported state and costs no network call. The
    /// handles live on <see cref="Profile"/> rather than in configuration because they are
    /// public identifiers that must be changeable without a redeploy; only the GitHub
    /// token stays in configuration, because it is a secret.
    /// </remarks>
    string? Handle(Profile profile);

    /// <summary>Fetches fresh data. Returning null means "no answer", not "no data".</summary>
    Task<TPayload?> FetchAsync(string handle, CancellationToken cancellationToken);
}
