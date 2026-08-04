using System.Net;
using System.Net.Http.Headers;
using Chronicle.Application.Common.Interfaces;
using Chronicle.Application.Common.Models;
using Chronicle.Infrastructure.Data;
using Chronicle.Infrastructure.Data.Interceptors;
using Chronicle.Infrastructure.Identity;
using Chronicle.Infrastructure.Services;
using Chronicle.Infrastructure.Services.Media;
using Chronicle.Infrastructure.Services.Remote;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

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
        services.Configure<SmtpOptions>(configuration.GetSection(SmtpOptions.SectionName));
        services.Configure<GitHubOptions>(configuration.GetSection(GitHubOptions.SectionName));
        services.Configure<MediaStorageOptions>(configuration.GetSection(MediaStorageOptions.SectionName));

        AddMediaStorage(services, configuration);

        services.AddSingleton<IDateTimeProvider, SystemDateTimeProvider>();
        services.AddScoped<IEmailService, SmtpEmailService>();
        services.AddScoped<IPostSearch, PostgresPostSearch>();
        services.AddScoped<AuditableEntityInterceptor>();

        // A typed client rather than a bare HttpClient: the base address, the required
        // User-Agent and the token are configured once here instead of at every call
        // site, and it inherits the resilience handler from ServiceDefaults.
        services.AddHttpClient<IGitHubService, GitHubService>((serviceProvider, client) =>
        {
            var github = serviceProvider.GetRequiredService<IOptions<GitHubOptions>>().Value;

            client.BaseAddress = new Uri("https://api.github.com/");
            // GitHub rejects requests without one, with a 403 that does not explain why.
            client.DefaultRequestHeaders.UserAgent.ParseAdd("Chronicle-Portfolio/1.0");
            client.DefaultRequestHeaders.Accept.ParseAdd("application/vnd.github+json");
            client.DefaultRequestHeaders.Add("X-GitHub-Api-Version", "2022-11-28");

            if (!string.IsNullOrWhiteSpace(github.Pat))
            {
                client.DefaultRequestHeaders.Authorization =
                    new AuthenticationHeaderValue("Bearer", github.Pat);
            }

            // A slow third party must not become a slow page. The cache is what the
            // reader actually sees, so giving up early costs nothing.
            client.Timeout = TimeSpan.FromSeconds(15);
        });

        AddRemoteProviders(services, configuration);

        // Handlers depend on the interface; both resolve to the same scoped instance,
        // so a handler and the initialiser share one change tracker per request.
        services.AddScoped<IChronicleDbContext>(sp => sp.GetRequiredService<ChronicleDbContext>());
        services.AddScoped<ChronicleDbContextInitialiser>();

        services.AddAuthentication(IdentityConstants.ApplicationScheme)
            .AddIdentityCookies();

        // Identity defaults these to /Account/Login, but the CMS lives under /admin.
        // Without this the cookie middleware bounces an unauthenticated visitor to a
        // path that does not exist, so /admin 404s instead of showing the sign-in page.
        services.ConfigureApplicationCookie(options =>
        {
            options.LoginPath = "/admin/login";
            options.LogoutPath = "/admin/logout";
            options.AccessDeniedPath = "/admin/login";

            options.Cookie.Name = "chronicle.auth";
            options.Cookie.HttpOnly = true;
            options.Cookie.SameSite = SameSiteMode.Lax;
            // SameAsRequest rather than Always so the cookie still works over plain
            // HTTP in local development; production is HTTPS-only via UseHttpsRedirection.
            options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;

            options.ExpireTimeSpan = TimeSpan.FromHours(8);
            options.SlidingExpiration = true;
        });

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

    /// <summary>
    /// Picks the media adapter, and refuses to pretend R2 is working when it is not.
    /// </summary>
    /// <remarks>
    /// Asking for R2 without credentials falls back to local disk with a warning rather
    /// than throwing. Throwing would take the whole site down over a feature only the
    /// operator uses; silently doing nothing would let uploads appear to succeed and
    /// vanish. A working fallback plus a log line is the honest middle.
    /// </remarks>
    /// <summary>
    /// The four non-GitHub services, each a typed client plus a <see cref="CachedRemote{T}"/>.
    /// </summary>
    /// <remarks>
    /// <para>
    /// All four are anonymous — no key, no account, no billing relationship. The handles
    /// they need come from the <c>Profile</c> row rather than configuration, so nothing
    /// here reads a username; only the base address and headers are fixed at this point.
    /// </para>
    /// <para>
    /// Each inherits the resilience handler from ServiceDefaults, and each gets the same
    /// short timeout as GitHub: the cached payload is what a reader actually sees, so
    /// giving up early on a slow third party costs nothing.
    /// </para>
    /// </remarks>
    private static void AddRemoteProviders(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<RemoteCacheOptions>(configuration.GetSection(RemoteCacheOptions.SectionName));

        AddProvider<StackOverflowProvider, StackOverflowStats>(
            services,
            "https://api.stackexchange.com/2.3/",
            // Stack Exchange responds gzipped whatever the request asks for. Without
            // automatic decompression every response is binary and every parse fails.
            gzip: true);

        AddProvider<CredlyProvider, CredlyBadges>(services, "https://www.credly.com/");
        AddProvider<DockerHubProvider, DockerHubStats>(services, "https://hub.docker.com/");
        AddProvider<MediumProvider, MediumFeed>(services, "https://medium.com/");

        services.AddScoped(typeof(IRemoteStats<>), typeof(CachedRemote<>));

        // No base address: this one is given a whole URL by the admin, and the allowlist
        // inside it is what decides whether that URL is ever requested.
        services.AddHttpClient<ICredentialLinkReader, OpenGraphCredentialReader>(client =>
        {
            client.DefaultRequestHeaders.UserAgent.ParseAdd("Chronicle-Portfolio/1.0");
            client.Timeout = TimeSpan.FromSeconds(10);
        });
    }

    private static void AddProvider<TProvider, TPayload>(
        IServiceCollection services,
        string baseAddress,
        bool gzip = false)
        where TProvider : class, IRemoteStatsProvider<TPayload>
        where TPayload : class
    {
        var builder = services.AddHttpClient<IRemoteStatsProvider<TPayload>, TProvider>(client =>
        {
            client.BaseAddress = new Uri(baseAddress);
            client.DefaultRequestHeaders.UserAgent.ParseAdd("Chronicle-Portfolio/1.0");
            client.Timeout = TimeSpan.FromSeconds(15);
        });

        if (gzip)
        {
            builder.ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
            {
                AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate,
            });
        }
    }

    private static void AddMediaStorage(IServiceCollection services, IConfiguration configuration)
    {
        var options = configuration
            .GetSection(MediaStorageOptions.SectionName)
            .Get<MediaStorageOptions>() ?? new MediaStorageOptions();

        if (options.Provider == MediaProvider.R2 && options.R2.IsConfigured)
        {
            services.AddSingleton<IMediaStorage, R2MediaStorage>();
            return;
        }

        if (options.Provider == MediaProvider.R2)
        {
            services.AddSingleton<IMediaStorage>(sp =>
            {
                MediaLog.R2NotConfigured(sp.GetRequiredService<ILogger<R2MediaStorage>>());
                return ActivatorUtilities.CreateInstance<LocalDiskMediaStorage>(sp);
            });
            return;
        }

        services.AddSingleton<IMediaStorage, LocalDiskMediaStorage>();
    }
}
