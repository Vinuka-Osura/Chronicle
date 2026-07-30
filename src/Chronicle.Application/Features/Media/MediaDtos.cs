namespace Chronicle.Application.Features.Media;

public sealed record ProjectImageDto(
    Guid Id,
    string Url,
    string? Caption,
    long SizeBytes,
    string ContentType,
    int? Width,
    int? Height,
    int SortOrder);

/// <summary>
/// What the admin storage gauge shows.
/// </summary>
/// <remarks>
/// The mitigation that made R2 acceptable under the zero-cost rule: the point is to see
/// the margin between what is used and what is free at a glance, rather than having to
/// open Cloudflare's dashboard to find out. A number nobody looks at is not a safeguard.
/// </remarks>
/// <param name="QuotaBytes">Null where the provider has no meaningful ceiling.</param>
public sealed record StorageUsageDto(
    string Provider,
    string Location,
    long UsedBytes,
    long? QuotaBytes,
    int FileCount)
{
    /// <summary>Percentage of the ceiling in use, or null when there is no ceiling.</summary>
    public double? PercentUsed => QuotaBytes is > 0
        ? Math.Round(UsedBytes * 100d / QuotaBytes.Value, 2)
        : null;
}
