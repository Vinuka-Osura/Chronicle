namespace Chronicle.Infrastructure.Identity;

/// <summary>
/// The single admin account, seeded on first run.
/// </summary>
/// <remarks>
/// Bound from the <c>Admin:*</c> configuration section. These values belong in dotnet
/// user-secrets locally and in deployment secrets in production - never in
/// appsettings.json, because this repository is public.
/// <para>
/// Deliberately not validated at startup. A fresh clone has no secrets set, and the
/// public site should still run; only <c>/admin</c> is unreachable until an operator
/// configures an account. <c>ChronicleDbContextInitialiser</c> logs a warning saying
/// exactly that, rather than the app failing to boot with a validation error.
/// </para>
/// </remarks>
public sealed class AdminSeedOptions
{
    public const string SectionName = "Admin";

    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string DisplayName { get; set; } = "Administrator";
}
