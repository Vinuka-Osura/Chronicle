using System.Reflection;
using Chronicle.Application.Common.Interfaces;
using Chronicle.Infrastructure.Data;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Npgsql;
using Respawn;

namespace Chronicle.Portfolio.Server.IntegrationTests;

/// <summary>
/// The real host, against a real PostgreSQL database.
/// </summary>
/// <remarks>
/// <para>
/// Real Postgres rather than SQLite or the EF in-memory provider, because the schema
/// uses <c>jsonb</c> and check constraints that neither of those honours - a test
/// passing against them would prove nothing about production. Testcontainers is not an
/// option either: there is no container runtime on this machine, so this points at a
/// <c>chronicle_test</c> database on the local instance and resets it with Respawn.
/// </para>
/// <para>
/// The environment is <c>Testing</c>, not Development, so the Sam Iversen sample content
/// does not seed. Tests that need content create exactly what they assert on, which is
/// the difference between a test that documents behaviour and one that documents the
/// seed data.
/// </para>
/// </remarks>
public sealed class ChronicleTestHost : WebApplicationFactory<Program>, IAsyncLifetime
{
    /// <summary>
    /// Where the test database lives.
    /// </summary>
    /// <remarks>
    /// From the environment, never a literal in the file: this repository is public, and
    /// a connection string committed to it is a credential published to the internet -
    /// even one for a local database, because people reuse passwords.
    /// <code>
    /// setx CHRONICLE_TEST_DB "Host=localhost;Port=5432;Database=chronicle_test;Username=postgres;Password=..."
    /// </code>
    /// The fallback is the stock local-development password, so a fresh clone with a
    /// default PostgreSQL install runs the suite without configuring anything.
    /// </remarks>
    private static readonly string ConnectionString =
        Environment.GetEnvironmentVariable("CHRONICLE_TEST_DB")
        ?? "Host=localhost;Port=5432;Database=chronicle_test;Username=postgres;Password=postgres";

    /// <summary>The same server, but the <c>postgres</c> database - you cannot CREATE DATABASE from inside the one being created.</summary>
    private static readonly string MaintenanceConnectionString =
        new NpgsqlConnectionStringBuilder(ConnectionString) { Database = "postgres" }.ConnectionString;

    private Respawner? _respawner;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration(config => config.AddInMemoryCollection(
        [
            new KeyValuePair<string, string?>("ConnectionStrings:chronicledb", ConnectionString),
            // Without these the initialiser logs "admin not configured" and moves on,
            // which is the behaviour a fresh clone gets and is fine here - no test signs in.
            new KeyValuePair<string, string?>("Admin:Email", string.Empty),
            new KeyValuePair<string, string?>("Admin:Password", string.Empty),
            // Never let a test reach the real GitHub API. Unconfigured is a supported
            // state, so the service serves an empty payload without a network call.
            new KeyValuePair<string, string?>("GitHub:Username", string.Empty),
            new KeyValuePair<string, string?>("GitHub:Pat", string.Empty),
            // Uploads go to a throwaway folder, not into the application's own. A test
            // run must not leave files in the directory a developer is working in, and
            // must not read files a previous run left behind.
            new KeyValuePair<string, string?>("Media:Provider", "LocalDisk"),
            new KeyValuePair<string, string?>("Media:LocalDisk:Root", MediaRoot)
        ]));
    }

    /// <summary>Where uploads land during a test run.</summary>
    public static string MediaRoot { get; } =
        Path.Combine(Path.GetTempPath(), "chronicle-tests", "media");

    // Implemented explicitly: xUnit's IAsyncLifetime.DisposeAsync returns Task, while the
    // IAsyncDisposable one inherited from WebApplicationFactory returns ValueTask. Same
    // name, different return type - only an explicit implementation can carry both.
    Task IAsyncLifetime.InitializeAsync() => StartAsync();

    Task IAsyncLifetime.DisposeAsync() => Task.CompletedTask;

    private async Task StartAsync()
    {
        await EnsureDatabaseExistsAsync().ConfigureAwait(false);

        // Touching Services boots the host, which runs migrations and seeding.
        _ = Services.GetRequiredService<IHostEnvironment>();

        await using var connection = new NpgsqlConnection(ConnectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        _respawner = await Respawner.CreateAsync(connection, new RespawnerOptions
        {
            DbAdapter = DbAdapter.Postgres,
            SchemasToInclude = ["public"],
            // Migration history and the seeded singletons are setup, not test data.
            // Deleting them would make every test after the first run against a database
            // the application does not consider valid.
            TablesToIgnore = ["__EFMigrationsHistory", "site_status", "site_github_stats_cache"]
        }).ConfigureAwait(false);
    }

    /// <summary>Empties the content tables so each test starts from a known state.</summary>
    /// <remarks>
    /// <b>The output cache is cleared too, and it has to be.</b> Respawn truncates tables
    /// directly, which no command knows about, so nothing evicts the tags — and the next
    /// test reads the previous test's cached response from an apparently empty database.
    /// That is not hypothetical: it made the career-graph contract test fail on data it
    /// had never created, and the symptom looked like a schema violation rather than a
    /// stale read.
    /// </remarks>
    public async Task ResetAsync()
    {
        if (_respawner is null)
        {
            return;
        }

        await using var connection = new NpgsqlConnection(ConnectionString);
        await connection.OpenAsync().ConfigureAwait(false);
        await _respawner.ResetAsync(connection).ConfigureAwait(false);

        var cache = Services.GetRequiredService<IOutputCacheStore>();
        foreach (var tag in AllCacheTags)
        {
            await cache.EvictByTagAsync(tag, CancellationToken.None).ConfigureAwait(false);
        }
    }

    /// <summary>Every tag the application uses, read off the constants so it cannot drift.</summary>
    private static readonly string[] AllCacheTags =
        [.. typeof(CacheTags)
            .GetFields(BindingFlags.Public | BindingFlags.Static)
            .Where(field => field.FieldType == typeof(string) && field.IsLiteral)
            .Select(field => (string)field.GetRawConstantValue()!)];

    /// <summary>Runs work in its own DI scope, the way a request would.</summary>
    public async Task<T> ScopedAsync<T>(Func<IServiceProvider, Task<T>> work)
    {
        ArgumentNullException.ThrowIfNull(work);

        await using var scope = Services.CreateAsyncScope();
        return await work(scope.ServiceProvider).ConfigureAwait(false);
    }

    public async Task ScopedAsync(Func<IServiceProvider, Task> work)
    {
        ArgumentNullException.ThrowIfNull(work);

        await using var scope = Services.CreateAsyncScope();
        await work(scope.ServiceProvider).ConfigureAwait(false);
    }

    public static ChronicleDbContext DbContext(IServiceProvider services)
    {
        ArgumentNullException.ThrowIfNull(services);
        return services.GetRequiredService<ChronicleDbContext>();
    }

    public override async ValueTask DisposeAsync()
    {
        await base.DisposeAsync().ConfigureAwait(false);
        GC.SuppressFinalize(this);
    }

    private static async Task EnsureDatabaseExistsAsync()
    {
        await using var connection = new NpgsqlConnection(MaintenanceConnectionString);
        await connection.OpenAsync().ConfigureAwait(false);

        await using var exists = new NpgsqlCommand(
            "SELECT 1 FROM pg_database WHERE datname = 'chronicle_test'", connection);

        if (await exists.ExecuteScalarAsync().ConfigureAwait(false) is not null)
        {
            return;
        }

        await using var create = new NpgsqlCommand("CREATE DATABASE chronicle_test", connection);
        await create.ExecuteNonQueryAsync().ConfigureAwait(false);
    }
}

/// <summary>
/// Shares one host across the whole class. Booting the host and migrating per test would
/// dominate the run time and prove nothing extra.
/// </summary>
[CollectionDefinition(Name)]
public sealed class ChronicleHostFixture : ICollectionFixture<ChronicleTestHost>
{
    public const string Name = "chronicle-host";
}
