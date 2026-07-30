namespace Chronicle.Infrastructure.Services.Media;

/// <summary>
/// Which media adapter runs, and what each needs.
/// </summary>
/// <remarks>
/// One switch, because the hosting decision is not settled and should not have to be
/// before the feature is written. Local disk works today with no account anywhere; R2
/// is a configuration change at deploy time. See <c>docs/deployment.md</c>.
/// </remarks>
public sealed class MediaStorageOptions
{
    public const string SectionName = "Media";

    /// <summary>
    /// <c>LocalDisk</c> or <c>R2</c>. Defaults to local disk so a fresh clone runs with
    /// nothing configured — the alternative is a feature that appears broken until
    /// someone finds the credentials documentation.
    /// </summary>
    public MediaProvider Provider { get; set; } = MediaProvider.LocalDisk;

    public LocalDiskOptions LocalDisk { get; set; } = new();

    public R2Options R2 { get; set; } = new();
}

public enum MediaProvider
{
    LocalDisk = 0,
    R2 = 1
}

public sealed class LocalDiskOptions
{
    /// <summary>
    /// Where files are written. Relative paths resolve against the content root, so the
    /// default keeps uploads inside the app's own folder in development.
    /// </summary>
    public string Root { get; set; } = "media-uploads";

    /// <summary>The route the server serves them back on.</summary>
    public string PublicPath { get; set; } = "/media";

    /// <summary>
    /// The ceiling the admin gauge measures against. Not enforced — local disk has no
    /// billing to protect against, so this is a sense of scale rather than a limit.
    /// </summary>
    public long QuotaBytes { get; set; } = 2L * 1024 * 1024 * 1024;
}

public sealed class R2Options
{
    public string AccountId { get; set; } = string.Empty;
    public string AccessKeyId { get; set; } = string.Empty;
    public string SecretAccessKey { get; set; } = string.Empty;
    public string Bucket { get; set; } = string.Empty;

    /// <summary>
    /// The public base URL for the bucket — an <c>r2.dev</c> address or a custom domain.
    /// Without it the objects are stored but not reachable, so the admin says so rather
    /// than writing URLs that 404.
    /// </summary>
    public string PublicBaseUrl { get; set; } = string.Empty;

    /// <summary>
    /// R2's free tier. Shown by the gauge so the margin is visible long before anything
    /// could ever bill — which was the whole condition for choosing R2.
    /// </summary>
    public long FreeTierBytes { get; set; } = 10L * 1024 * 1024 * 1024;

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(AccountId)
        && !string.IsNullOrWhiteSpace(AccessKeyId)
        && !string.IsNullOrWhiteSpace(SecretAccessKey)
        && !string.IsNullOrWhiteSpace(Bucket);

    /// <summary>R2's S3-compatible endpoint for this account.</summary>
    public string ServiceUrl => $"https://{AccountId}.r2.cloudflarestorage.com";
}
