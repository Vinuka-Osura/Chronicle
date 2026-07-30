namespace Chronicle.Infrastructure.Data.Seeding;

/// <summary>
/// The registry of feature seeders, in run order.
/// </summary>
/// <remarks>
/// Listed explicitly rather than discovered by assembly scanning: with a fixed, small
/// set, an explicit list is easier to read, orders itself, and cannot surprise anyone
/// by picking up a stray type.
/// </remarks>
public static class FeatureSeeders
{
    public static IReadOnlyList<IFeatureSeeder> All { get; } =
    [
        new SharedSeeder(),
        new ErasSeeder(),
        new SkillsSeeder(),
        new ProjectsSeeder(),
        new ExperienceSeeder(),
        new MilestonesSeeder(),
        new KnowledgeSeeder(),
        new RoadmapSeeder(),
        new CertificationsSeeder(),
        new SiteSeeder(),
    ];

    public static async Task RunAsync(
        ChronicleDbContext context,
        CancellationToken cancellationToken = default)
    {
        foreach (var seeder in All.OrderBy(s => s.Order))
        {
            await seeder.SeedAsync(context, cancellationToken).ConfigureAwait(false);
        }
    }
}
