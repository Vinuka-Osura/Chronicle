using Chronicle.Application.Common.Interfaces;
using Chronicle.Infrastructure.Data;
using Chronicle.Infrastructure.Data.Interceptors;
using Chronicle.Infrastructure.Identity;
using Chronicle.Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Chronicle.Infrastructure;

public static class DependencyInjection
{
    /// <summary>
    /// Registers persistence-adjacent services and Identity.
    /// </summary>
    /// <remarks>
    /// <see cref="ChronicleDbContext"/> itself is registered by the host, because the
    /// Aspire integration owns the connection string, health check and tracing wiring.
    /// The host passes <see cref="AuditableEntityInterceptor"/> into those options.
    /// </remarks>
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<AdminSeedOptions>(configuration.GetSection(AdminSeedOptions.SectionName));

        services.AddSingleton<IDateTimeProvider, SystemDateTimeProvider>();
        services.AddScoped<AuditableEntityInterceptor>();

        // Handlers depend on the interface; both resolve to the same scoped instance,
        // so a handler and the initialiser share one change tracker per request.
        services.AddScoped<IChronicleDbContext>(sp => sp.GetRequiredService<ChronicleDbContext>());
        services.AddScoped<ChronicleDbContextInitialiser>();

        services.AddAuthentication(IdentityConstants.ApplicationScheme)
            .AddIdentityCookies();

        services.AddIdentityCore<ApplicationUser>(options =>
            {
                options.User.RequireUniqueEmail = true;
                options.SignIn.RequireConfirmedAccount = false;

                // One human operator, so lockout is tuned against online password
                // guessing rather than against a support desk full of reset requests.
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);

                options.Password.RequiredLength = 12;
                options.Password.RequireNonAlphanumeric = true;
                options.Password.RequireUppercase = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireDigit = true;
            })
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<ChronicleDbContext>()
            .AddSignInManager()
            .AddDefaultTokenProviders();

        return services;
    }
}
