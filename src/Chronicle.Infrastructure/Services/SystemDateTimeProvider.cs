using Chronicle.Application.Common.Interfaces;

namespace Chronicle.Infrastructure.Services;

/// <inheritdoc />
public sealed class SystemDateTimeProvider : IDateTimeProvider
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
