using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Chronicle.Infrastructure.Data;

/// <summary>
/// Design-time factory used by <c>dotnet ef</c>.
/// </summary>
/// <remarks>
/// Without this, the EF tools boot the web host to find a DbContext, which drags in
/// Aspire's connection wiring and means you cannot scaffold a migration unless the
/// database is reachable. Migrations are a build-time artefact of the model, not of any
/// running server, so the factory hands EF a connection string it only needs to parse.
/// <para>
/// Override with <c>ConnectionStrings__chronicledb</c> when running a command that does
/// touch the database, such as <c>dotnet ef database update</c>.
/// </para>
/// </remarks>
public sealed class ChronicleDbContextFactory : IDesignTimeDbContextFactory<ChronicleDbContext>
{
    private const string DesignTimeFallback =
        "Host=localhost;Port=5432;Database=chronicle;Username=postgres;Password=design-time-only";

    public ChronicleDbContext CreateDbContext(string[] args)
    {
        var connectionString =
            Environment.GetEnvironmentVariable("ConnectionStrings__chronicledb")
            ?? DesignTimeFallback;

        var options = new DbContextOptionsBuilder<ChronicleDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new ChronicleDbContext(options);
    }
}
