namespace Chronicle.Infrastructure.Data.Seeding;

/// <summary>
/// Initial data owned by one feature.
/// </summary>
/// <remarks>
/// These run on every start, in every environment, so an implementation MUST be
/// idempotent — check before you insert. Adding rows unconditionally would duplicate
/// them on the second run.
/// <para>
/// Distinct from <c>SampleContent</c>, which is throwaway development data that only
/// runs when the content tables are empty. This is for data the application genuinely
/// needs: reference rows, a default taxonomy, a fixed singleton.
/// </para>
/// <para>
/// Implementations do not call <c>SaveChangesAsync</c>. The initialiser saves once
/// after every seeder has run, so the whole set lands in a single transaction.
/// </para>
/// </remarks>
public interface IFeatureSeeder
{
    /// <summary>Ordering hint. Lower runs first; use it when one feature's data references another's.</summary>
    int Order => 100;

    Task SeedAsync(ChronicleDbContext context, CancellationToken cancellationToken = default);
}
