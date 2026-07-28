using Microsoft.AspNetCore.Identity;

namespace Chronicle.Infrastructure.Identity;

/// <summary>
/// The admin account. There is exactly one, seeded from configuration on first run;
/// the CMS has no registration flow because it has no second user.
/// </summary>
/// <remarks>
/// Keyed by <see cref="Guid"/> to match the rest of the model rather than Identity's
/// default string key.
/// </remarks>
public class ApplicationUser : IdentityUser<Guid>
{
    public string? DisplayName { get; set; }
}
