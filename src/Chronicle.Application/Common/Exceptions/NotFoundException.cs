namespace Chronicle.Application.Common.Exceptions;

/// <summary>
/// Thrown when a handler is asked for something that does not exist.
/// Translated to a 404 ProblemDetails by the host's exception handler.
/// </summary>
public class NotFoundException : Exception
{
    public NotFoundException()
        : base("The requested resource was not found.")
    {
    }

    public NotFoundException(string message)
        : base(message)
    {
    }

    public NotFoundException(string message, Exception innerException)
        : base(message, innerException)
    {
    }

    public NotFoundException(string entityName, object key)
        : base($"{entityName} '{key}' was not found.")
    {
    }
}
