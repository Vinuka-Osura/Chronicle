using Chronicle.Application.Common.Exceptions;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Chronicle.Application.Common.Behaviours;

/// <summary>
/// Logs unexpected exceptions with the request name attached, then rethrows so the
/// host still turns them into ProblemDetails.
/// </summary>
/// <remarks>
/// Validation and not-found failures are expected control flow, not defects, so they
/// pass through unlogged - otherwise the error log fills with 404s and stops being
/// the place you look when something is actually wrong.
/// </remarks>
public sealed class UnhandledExceptionBehaviour<TRequest, TResponse>(
    ILogger<UnhandledExceptionBehaviour<TRequest, TResponse>> logger)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        try
        {
            return await next(cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not (ValidationException or NotFoundException))
        {
            BehaviourLog.UnhandledException(logger, ex, typeof(TRequest).Name);
            throw;
        }
    }
}
