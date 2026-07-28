using Chronicle.Application.Common.Interfaces;
using Chronicle.Domain.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Chronicle.Infrastructure.Data.Interceptors;

/// <summary>
/// Stamps <see cref="IAuditable.CreatedAt"/> and <see cref="IAuditable.UpdatedAt"/>
/// on every insert and update.
/// </summary>
/// <remarks>
/// An interceptor rather than a <c>SaveChanges</c> override: it is the current EF Core
/// idiom, it composes with other interceptors, and it keeps the DbContext free of
/// cross-cutting concerns.
/// <para>
/// The clock is injected so audit stamps are deterministic under test.
/// </para>
/// </remarks>
public sealed class AuditableEntityInterceptor(IDateTimeProvider clock) : SaveChangesInterceptor
{
    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData,
        InterceptionResult<int> result)
    {
        StampTimestamps(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        StampTimestamps(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void StampTimestamps(DbContext? context)
    {
        if (context is null)
        {
            return;
        }

        var now = clock.UtcNow;

        foreach (var entry in context.ChangeTracker.Entries<IAuditable>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = now;
                    entry.Entity.UpdatedAt = now;
                    break;

                case EntityState.Modified:
                    entry.Entity.UpdatedAt = now;
                    break;

                default:
                    break;
            }
        }
    }
}
