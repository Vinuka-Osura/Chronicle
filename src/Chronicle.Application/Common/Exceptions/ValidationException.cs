using FluentValidation.Results;

namespace Chronicle.Application.Common.Exceptions;

/// <summary>
/// Thrown by <c>ValidationBehaviour</c> when a request fails its validators.
/// Translated to a 400 ProblemDetails carrying the per-field errors.
/// </summary>
public class ValidationException : Exception
{
    public ValidationException()
        : base("One or more validation failures occurred.")
    {
        Errors = new Dictionary<string, string[]>();
    }

    public ValidationException(string message)
        : base(message)
    {
        Errors = new Dictionary<string, string[]>();
    }

    public ValidationException(string message, Exception innerException)
        : base(message, innerException)
    {
        Errors = new Dictionary<string, string[]>();
    }

    public ValidationException(IEnumerable<ValidationFailure> failures)
        : this()
    {
        Errors = failures
            .GroupBy(f => f.PropertyName, f => f.ErrorMessage)
            .ToDictionary(g => g.Key, g => g.ToArray(), StringComparer.Ordinal);
    }

    /// <summary>Field name to the messages that failed for it.</summary>
    public IDictionary<string, string[]> Errors { get; }
}
