namespace Chronicle.Application.Common.Exceptions;

/// <summary>
/// Thrown when a feature cannot run because something it depends on is not configured or
/// not reachable. Translated to a 503 ProblemDetails by the host's exception handler.
/// </summary>
/// <remarks>
/// Distinct from an unexpected failure on purpose: the caller did nothing wrong, the
/// request may well succeed later, and the message can safely say which capability is
/// missing.
/// </remarks>
public class ServiceUnavailableException : Exception
{
    public ServiceUnavailableException()
        : base("That capability is not available right now.")
    {
    }

    public ServiceUnavailableException(string message)
        : base(message)
    {
    }

    public ServiceUnavailableException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
