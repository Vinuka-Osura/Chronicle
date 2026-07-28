using FluentValidation;
using MediatR;
using ValidationException = Chronicle.Application.Common.Exceptions.ValidationException;

namespace Chronicle.Application.Common.Behaviours;

/// <summary>
/// Runs every FluentValidation validator registered for a request before its handler.
/// </summary>
/// <remarks>
/// Validation lives here rather than in MVC model binding so it applies uniformly to
/// every caller - minimal API endpoints and Blazor admin forms alike - and so handlers
/// can assume their input is already well-formed.
/// </remarks>
public sealed class ValidationBehaviour<TRequest, TResponse>(
    IEnumerable<IValidator<TRequest>> validators)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var applicable = validators as IValidator<TRequest>[] ?? [.. validators];
        if (applicable.Length == 0)
        {
            return await next(cancellationToken).ConfigureAwait(false);
        }

        var context = new ValidationContext<TRequest>(request);

        var results = await Task.WhenAll(
            applicable.Select(v => v.ValidateAsync(context, cancellationToken)))
            .ConfigureAwait(false);

        var failures = results.SelectMany(r => r.Errors).Where(f => f is not null).ToArray();

        return failures.Length != 0
            ? throw new ValidationException(failures)
            : await next(cancellationToken).ConfigureAwait(false);
    }
}
