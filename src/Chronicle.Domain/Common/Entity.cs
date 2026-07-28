namespace Chronicle.Domain.Common;

/// <summary>
/// Base for every persisted entity. Ids are <see cref="Guid"/> and generated
/// server-side rather than by the database, so a graph can be built and wired
/// up in memory before it is ever saved.
/// </summary>
public abstract class Entity
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
}
