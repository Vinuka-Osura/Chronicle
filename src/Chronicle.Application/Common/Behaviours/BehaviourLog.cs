using Microsoft.Extensions.Logging;

namespace Chronicle.Application.Common.Behaviours;

/// <summary>
/// Source-generated log messages for the MediatR pipeline.
/// </summary>
/// <remarks>
/// The <c>[LoggerMessage]</c> generator produces strongly-typed, allocation-free
/// delegates (CA1848) instead of the boxing <c>ILogger.LogX(...)</c> extension calls.
/// It cannot emit into a generic type, so the behaviours - which are all generic -
/// delegate to this non-generic holder rather than declaring the methods inline.
/// </remarks>
internal static partial class BehaviourLog
{
    [LoggerMessage(
        EventId = 1000,
        Level = LogLevel.Warning,
        Message = "Slow request: {RequestName} took {ElapsedMilliseconds}ms")]
    public static partial void SlowRequest(ILogger logger, string requestName, long elapsedMilliseconds);

    [LoggerMessage(
        EventId = 1001,
        Level = LogLevel.Error,
        Message = "Unhandled exception for request {RequestName}")]
    public static partial void UnhandledException(ILogger logger, Exception exception, string requestName);
}
