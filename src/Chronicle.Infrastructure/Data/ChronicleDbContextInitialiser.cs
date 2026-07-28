using Chronicle.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Chronicle.Infrastructure.Data;

/// <summary>
/// Applies migrations and seeds the database. Both operations are idempotent, so
/// running them on every start is safe.
/// </summary>
public sealed partial class ChronicleDbContextInitialiser(
    ILogger<ChronicleDbContextInitialiser> logger,
    ChronicleDbContext context,
    UserManager<ApplicationUser> userManager,
    IOptions<AdminSeedOptions> adminOptions)
{
    public async Task MigrateAsync(CancellationToken cancellationToken = default)
    {
        var pending = await context.Database
            .GetPendingMigrationsAsync(cancellationToken)
            .ConfigureAwait(false);

        var names = pending as string[] ?? [.. pending];
        if (names.Length == 0)
        {
            LogSchemaUpToDate(logger);
            return;
        }

        LogApplyingMigrations(logger, names.Length);
        await context.Database.MigrateAsync(cancellationToken).ConfigureAwait(false);
    }

    /// <summary>
    /// Seeds the admin account and the two singleton rows in every environment, and
    /// sample content only when the content tables are empty.
    /// </summary>
    public async Task SeedAsync(bool includeSampleContent, CancellationToken cancellationToken = default)
    {
        await SeedAdminUserAsync().ConfigureAwait(false);
        await SeedSingletonsAsync(cancellationToken).ConfigureAwait(false);

        if (includeSampleContent)
        {
            await SampleContent.SeedAsync(context, logger, cancellationToken).ConfigureAwait(false);
        }

        await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private async Task SeedAdminUserAsync()
    {
        var admin = adminOptions.Value;

        if (string.IsNullOrWhiteSpace(admin.Email) || string.IsNullOrWhiteSpace(admin.Password))
        {
            // Not a failure: a fresh clone has no secrets set yet. The site still runs,
            // only /admin is unreachable until the operator configures an account.
            LogAdminNotConfigured(logger);
            return;
        }

        if (await userManager.FindByEmailAsync(admin.Email).ConfigureAwait(false) is not null)
        {
            return;
        }

        var user = new ApplicationUser
        {
            UserName = admin.Email,
            Email = admin.Email,
            EmailConfirmed = true,
            DisplayName = admin.DisplayName
        };

        var result = await userManager.CreateAsync(user, admin.Password).ConfigureAwait(false);

        if (result.Succeeded)
        {
            LogAdminCreated(logger, admin.Email);
        }
        else
        {
            // Surface why - almost always a password that fails the configured policy.
            LogAdminCreateFailed(logger, string.Join("; ", result.Errors.Select(e => e.Description)));
        }
    }

    private async Task SeedSingletonsAsync(CancellationToken cancellationToken)
    {
        if (!await context.SiteStatuses.AnyAsync(cancellationToken).ConfigureAwait(false))
        {
            context.SiteStatuses.Add(new Domain.Entities.SiteStatus
            {
                Id = Domain.Entities.SiteStatus.SingletonId,
                CurrentFocus = "Building Chronicle - the backend that powers this site.",
                Mood = "Shipping"
            });
        }

        if (!await context.GitHubStatsCaches.AnyAsync(cancellationToken).ConfigureAwait(false))
        {
            context.GitHubStatsCaches.Add(new Domain.Entities.GitHubStatsCache
            {
                Id = Domain.Entities.GitHubStatsCache.SingletonId,
                PayloadJson = "{}",
                // Epoch marks "never fetched", so the first request refreshes immediately.
                FetchedAt = DateTimeOffset.UnixEpoch
            });
        }
    }

    [LoggerMessage(EventId = 2000, Level = LogLevel.Information, Message = "Database schema is up to date.")]
    private static partial void LogSchemaUpToDate(ILogger logger);

    [LoggerMessage(EventId = 2001, Level = LogLevel.Information, Message = "Applying {Count} pending migration(s).")]
    private static partial void LogApplyingMigrations(ILogger logger, int count);

    [LoggerMessage(EventId = 2002, Level = LogLevel.Warning,
        Message = "Admin:Email / Admin:Password are not configured, so no admin account was seeded. " +
                  "Set them with: dotnet user-secrets set \"Admin:Password\" \"<value>\"")]
    private static partial void LogAdminNotConfigured(ILogger logger);

    [LoggerMessage(EventId = 2003, Level = LogLevel.Information, Message = "Seeded admin account {Email}.")]
    private static partial void LogAdminCreated(ILogger logger, string email);

    [LoggerMessage(EventId = 2004, Level = LogLevel.Error, Message = "Could not create the admin account: {Errors}")]
    private static partial void LogAdminCreateFailed(ILogger logger, string errors);
}
