namespace Chronicle.Application.Common.Interfaces;

/// <summary>
/// Port over blob storage for admin image uploads. Only the returned URL is persisted;
/// the bytes never live in PostgreSQL.
/// </summary>
public interface IMediaStorage
{
    /// <returns>The public URL of the stored object.</returns>
    Task<string> UploadAsync(
        Stream content,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(string url, CancellationToken cancellationToken = default);
}
