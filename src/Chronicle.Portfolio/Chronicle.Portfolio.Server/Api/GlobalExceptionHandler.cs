using Chronicle.Application.Common.Exceptions;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using ValidationException = Chronicle.Application.Common.Exceptions.ValidationException;

namespace Chronicle.Portfolio.Server.Api;

/// <summary>
/// Translates application exceptions into RFC-7807 ProblemDetails.
/// </summary>
/// <remarks>
/// Expected failures carry their message through, because the caller caused them and
/// needs to know what to fix. Anything unexpected is deliberately opaque: the details
/// are logged server-side by <c>UnhandledExceptionBehaviour</c>, and a public API must
/// not leak stack traces or connection strings to whoever asked.
/// </remarks>
internal sealed class GlobalExceptionHandler(
    IProblemDetailsService problemDetailsService,
    IHostEnvironment environment) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var problemDetails = exception switch
        {
            ValidationException validation => BuildValidationProblem(validation),
            NotFoundException notFound => new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Resource not found",
                Detail = notFound.Message
            },
            _ => new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "An unexpected error occurred",
                // Only in Development, and only because the alternative is debugging blind.
                Detail = environment.IsDevelopment() ? exception.ToString() : null
            }
        };

        httpContext.Response.StatusCode =
            problemDetails.Status ?? StatusCodes.Status500InternalServerError;

        return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = problemDetails,
            Exception = exception
        }).ConfigureAwait(false);
    }

    private static ProblemDetails BuildValidationProblem(ValidationException exception)
    {
        var problem = new ProblemDetails
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "One or more validation errors occurred"
        };

        problem.Extensions["errors"] = exception.Errors;
        return problem;
    }
}
