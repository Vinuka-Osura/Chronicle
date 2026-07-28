using Chronicle.Domain.Common;

namespace Chronicle.Domain.Entities;

/// <summary>
/// Editorial half of the Mission Control status strip; the live half comes from
/// <see cref="GitHubStatsCache"/>.
/// </summary>
/// <remarks>
/// Single-row table. <see cref="SingletonId"/> is seeded and never changes, so the
/// admin screen only ever edits — it cannot create a second row.
/// </remarks>
public class SiteStatus : AuditableEntity
{
    /// <summary>Fixed primary key for the one and only row.</summary>
    public static readonly Guid SingletonId = new("0195c0de-0000-7000-8000-000000000001");

    /// <summary>What is being worked on right now, set by hand in the admin.</summary>
    public string CurrentFocus { get; set; } = string.Empty;

    public string? Mood { get; set; }
}
