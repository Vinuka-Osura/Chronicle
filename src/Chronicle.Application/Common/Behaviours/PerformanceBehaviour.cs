using System.Diagnostics;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Chronicle.Application.Common.Behaviours;

/// <summary>
/// Warns when a request takes longer than <see cref="SlowRequestThresholdMs"/>.
/// </summary>
/// <remarks>
/// The public site is output-cached, so a slow handler hides easily behind a warm
/// cache and only shows up as a bad cold-start for a real visitor. This surfaces it
/// in the logs while it is still cheap to fix.
/// </remarks>
public sealed class PerformanceBehaviour<TRequest, TResponse>(
    ILogger<PerformanceBehaviour<TRequest, TResponse>> logger)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private const long SlowRequestThresholdMs = 500;

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var timer = Stopwatch.StartNew();
        var response = await next(cancellationToken).ConfigureAwait(false);
        timer.Stop();

        if (timer.ElapsedMilliseconds > SlowRequestThresholdMs)
        {
            BehaviourLog.SlowRequest(logger, typeof(TRequest).Name, timer.ElapsedMilliseconds);
        }

        return response;
    }
}
