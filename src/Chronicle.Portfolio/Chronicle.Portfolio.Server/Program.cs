using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Chronicle.Application;
using Chronicle.Application.Common.Interfaces;
using Chronicle.Infrastructure;
using Chronicle.Infrastructure.Data;
using Chronicle.Infrastructure.Data.Interceptors;
using Chronicle.Portfolio.Server.Api;
using Chronicle.Portfolio.Server.Api.Endpoints;
using Chronicle.Portfolio.Server.Components;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// ---------------------------------------------------------------------------
// Observability
// ---------------------------------------------------------------------------
builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .WriteTo.Console());

// OpenTelemetry, health checks, service discovery and HTTP resilience.
builder.AddServiceDefaults();

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------
// Registered by hand rather than via AddNpgsqlDbContext because the audit
// interceptor needs the service provider. EnrichNpgsqlDbContext then layers on the
// Aspire behaviour - health check, connection retries and EF tracing - over it.
builder.Services.AddDbContext<ChronicleDbContext>((serviceProvider, options) =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("chronicledb"));
    options.AddInterceptors(serviceProvider.GetRequiredService<AuditableEntityInterceptor>());
});
builder.EnrichNpgsqlDbContext<ChronicleDbContext>();

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddScoped<IContentCacheInvalidator, OutputCacheContentInvalidator>();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
builder.Services.ConfigureHttpJsonOptions(options =>
{
    // Enums travel as strings so the client contract reads "Planned", not 0.
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.AddProblemDetails(options =>
    options.CustomizeProblemDetails = context =>
        context.ProblemDetails.Instance = $"{context.HttpContext.Request.Method} {context.HttpContext.Request.Path}");
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

builder.Services.AddOpenApi(options =>
    // Blazor's component endpoints are not part of the public contract.
    options.ShouldInclude = description =>
        description.RelativePath?.StartsWith("api/", StringComparison.OrdinalIgnoreCase) == true);

builder.Services.AddOutputCache(options =>
    options.AddBasePolicy(policy => policy.Expire(TimeSpan.FromSeconds(60))));

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy
    .WithOrigins(allowedOrigins)
    .WithMethods("GET", "POST")
    .AllowAnyHeader()));

// The API is anonymous and cacheable, so this is scrape protection rather than
// authorisation. Generous enough that a real visitor never notices.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("api", context => RateLimitPartition.GetFixedWindowLimiter(
        partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        factory: _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 120,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0
        }));
});

// ---------------------------------------------------------------------------
// Admin CMS (Blazor Server, same host, behind Identity)
// ---------------------------------------------------------------------------
builder.Services.AddRazorComponents().AddInteractiveServerComponents();
builder.Services.AddCascadingAuthenticationState();
builder.Services.AddAuthorization();

var app = builder.Build();

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------
app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options => options.WithTitle("Chronicle API"));
}
else
{
    app.UseHsts();
}

app.UseSerilogRequestLogging();
app.UseHttpsRedirection();

app.UseCors();
app.UseRateLimiter();
app.UseOutputCache();

app.UseAuthentication();
app.UseAuthorization();
// Must follow authentication: Blazor's admin forms are antiforgery-protected, and the
// token is tied to the authenticated user.
app.UseAntiforgery();

app.MapStaticAssets();

app.MapProjectEndpoints();
app.MapAccountEndpoints();

// This host serves the API and the CMS; the public site is the Next.js client.
app.MapGet("/", () => Results.Redirect("/admin")).ExcludeFromDescription();

app.MapRazorComponents<App>().AddInteractiveServerRenderMode();

// Aspire health and liveness endpoints.
app.MapDefaultEndpoints();

// ---------------------------------------------------------------------------
// Schema + seed
// ---------------------------------------------------------------------------
await using (var scope = app.Services.CreateAsyncScope())
{
    var initialiser = scope.ServiceProvider.GetRequiredService<ChronicleDbContextInitialiser>();
    await initialiser.MigrateAsync();
    await initialiser.SeedAsync(includeSampleContent: app.Environment.IsDevelopment());
}

await app.RunAsync();

/// <summary>Exposed so the integration tests can drive the real host via WebApplicationFactory.</summary>
public partial class Program;
