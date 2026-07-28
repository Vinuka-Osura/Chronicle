namespace Chronicle.Application.Common.Interfaces;

/// <summary>
/// Clock abstraction so anything time-dependent - the Timeline's "today" boundary,
/// GitHub cache staleness, audit stamps - stays deterministic under test.
/// </summary>
public interface IDateTimeProvider
{
    DateTimeOffset UtcNow { get; }

    DateOnly Today => DateOnly.FromDateTime(UtcNow.UtcDateTime);
}
