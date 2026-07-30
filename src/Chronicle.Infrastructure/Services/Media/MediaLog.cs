using Microsoft.Extensions.Logging;

namespace Chronicle.Infrastructure.Services.Media;

/// <summary>Source-generated log messages (CA1848).</summary>
internal static partial class MediaLog
{
    [LoggerMessage(
        EventId = 4001,
        Level = LogLevel.Information,
        Message = "Stored {Key} on local disk ({SizeBytes} bytes).")]
    public static partial void StoredLocally(ILogger logger, string key, long sizeBytes);

    [LoggerMessage(
        EventId = 4002,
        Level = LogLevel.Information,
        Message = "Stored {Key} in R2 ({SizeBytes} bytes).")]
    public static partial void StoredInR2(ILogger logger, string key, long sizeBytes);

    [LoggerMessage(
        EventId = 4003,
        Level = LogLevel.Warning,
        Message = "Media provider is R2 but it is not configured; falling back to local disk. "
            + "Uploads will not survive a redeploy on a host without a persistent volume.")]
    public static partial void R2NotConfigured(ILogger logger);
}
