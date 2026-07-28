namespace Chronicle.Domain.Common;

/// <summary>
/// Marks an entity whose timestamps are maintained automatically.
/// <c>AuditableEntityInterceptor</c> in the Infrastructure layer stamps these on
/// save; nothing in the application should assign them by hand.
/// </summary>
public interface IAuditable
{
    DateTimeOffset CreatedAt { get; set; }
    DateTimeOffset UpdatedAt { get; set; }
}
