namespace Chronicle.Infrastructure.Data.Seeding;

/// <summary>
/// Initial data for the Milestones feature — owns profile_milestones.
/// </summary>
/// <remarks>
/// Intentionally empty. This is the hook for real initial data, so that when it is
/// needed it has an obvious home instead of being wedged into whatever file is nearest.
/// Development sample data belongs in <c>SampleContent</c>, not here.
/// <para>
/// Whatever you add must be idempotent — this runs on every start. The usual shape:
/// </para>
/// <code>
/// if (await context.Milestones.AnyAsync(cancellationToken).ConfigureAwait(false))
/// {
///     return;
/// }
///
/// context.Milestones.Add(new Milestone { /* ... */ });
/// </code>
/// Do not call SaveChangesAsync; the initialiser saves once after every seeder has run.
/// </remarks>
internal sealed class MilestonesSeeder : IFeatureSeeder
{
    public int Order => 45;

    public Task SeedAsync(ChronicleDbContext context, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
}
