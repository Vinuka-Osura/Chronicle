namespace Chronicle.Application.Common.Interfaces;

/// <summary>
/// Port over blob storage for admin image uploads. The bytes never live in PostgreSQL.
/// </summary>
/// <remarks>
/// Two adapters implement this: local disk, for development and for a server that has
/// its own persistent volume, and Cloudflare R2 for object storage. Which one runs is a
/// configuration switch, so the hosting decision never reaches into the code.
/// </remarks>
public interface IMediaStorage
{
    /// <summary>Stores an already-validated image and returns where it went.</summary>
    /// <param name="content">The bytes, rewound by the caller. Not disposed here.</param>
    /// <param name="fileName">
    /// The operator's filename. Used only for its extension and to be recorded in
    /// metadata — <b>never</b> to build the storage key, because a filename is untrusted
    /// input in the general case and <c>../../</c> is a valid one.
    /// </param>
    Task<StoredMedia> UploadAsync(
        Stream content,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default);

    /// <summary>Removes an object by its key. A missing object is not an error.</summary>
    /// <remarks>
    /// Deleting something already gone is the state the caller asked for, and a row whose
    /// file vanished must still be deletable — otherwise the CMS keeps an entry nobody
    /// can remove.
    /// </remarks>
    Task DeleteAsync(string storageKey, CancellationToken cancellationToken = default);

    /// <summary>Which backing store is live, and what ceiling to measure against.</summary>
    MediaStorageInfo Describe();
}

/// <param name="StorageKey">The key to pass back to <see cref="IMediaStorage.DeleteAsync"/>.</param>
/// <param name="Url">The public address a browser fetches.</param>
public sealed record StoredMedia(
    string StorageKey,
    string Url,
    long SizeBytes,
    string ContentType);

/// <param name="QuotaBytes">
/// The ceiling the gauge measures against, or null where there is no meaningful one.
/// For R2 this is the free tier rather than a hard limit — which is precisely why it is
/// worth showing: the point is to see the margin long before anything could bill.
/// </param>
public sealed record MediaStorageInfo(string Provider, long? QuotaBytes, string Location);
