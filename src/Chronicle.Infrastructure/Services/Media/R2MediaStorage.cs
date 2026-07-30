using Amazon.S3;
using Amazon.S3.Model;
using Chronicle.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Chronicle.Infrastructure.Services.Media;

/// <summary>
/// Cloudflare R2, through its S3-compatible API.
/// </summary>
/// <remarks>
/// <para>
/// The AWS SDK is used unmodified: R2 speaks S3, so there is no bespoke client to write
/// or maintain. Two settings make it point at Cloudflare instead of Amazon — the service
/// URL, and forcing path-style addressing, because R2 does not do virtual-host buckets.
/// </para>
/// <para>
/// R2 was chosen over S3 for one reason above all: <b>egress is free</b>. S3 bills per
/// byte served, which is the cost that surprises people, and a portfolio's whole job is
/// to be looked at.
/// </para>
/// </remarks>
public sealed class R2MediaStorage : IMediaStorage, IDisposable
{
    private readonly R2Options _options;
    private readonly IDateTimeProvider _clock;
    private readonly ILogger<R2MediaStorage> _logger;
    private readonly AmazonS3Client _client;

    public R2MediaStorage(
        IOptions<MediaStorageOptions> options,
        IDateTimeProvider clock,
        ILogger<R2MediaStorage> logger)
    {
        ArgumentNullException.ThrowIfNull(options);

        _options = options.Value.R2;
        _clock = clock;
        _logger = logger;

        _client = new AmazonS3Client(
            _options.AccessKeyId,
            _options.SecretAccessKey,
            new AmazonS3Config
            {
                ServiceURL = _options.ServiceUrl,
                // R2 has no virtual-hosted-style addressing; without this the SDK builds
                // bucket.account.r2.cloudflarestorage.com, which does not resolve.
                ForcePathStyle = true,
                // R2 is a single global namespace, but the SDK insists on a region.
                AuthenticationRegion = "auto"
            });
    }

    public async Task<StoredMedia> UploadAsync(
        Stream content,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(content);

        var key = MediaKey.Create(_clock.UtcNow, Path.GetExtension(fileName));
        var size = content.Length;

        await _client.PutObjectAsync(
            new PutObjectRequest
            {
                BucketName = _options.Bucket,
                Key = key,
                InputStream = content,
                ContentType = contentType,
                // Keys carry a Version 7 GUID and are never reused, so an object is
                // immutable once written and can be cached indefinitely.
                Headers = { CacheControl = "public, max-age=31536000, immutable" }
            },
            cancellationToken).ConfigureAwait(false);

        MediaLog.StoredInR2(_logger, key, size);

        return new StoredMedia(key, PublicUrl(key), size, contentType);
    }

    public async Task DeleteAsync(string storageKey, CancellationToken cancellationToken = default)
    {
        // S3 DELETE is idempotent and succeeds for a key that was never there, which is
        // the behaviour this port promises.
        await _client.DeleteObjectAsync(
            new DeleteObjectRequest { BucketName = _options.Bucket, Key = storageKey },
            cancellationToken).ConfigureAwait(false);
    }

    public MediaStorageInfo Describe() =>
        new("Cloudflare R2", _options.FreeTierBytes, _options.Bucket);

    private string PublicUrl(string key) =>
        $"{_options.PublicBaseUrl.TrimEnd('/')}/{key}";

    public void Dispose() => _client.Dispose();
}
