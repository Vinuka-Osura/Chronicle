using Chronicle.Application.Common.Interfaces;
using Chronicle.Domain.Entities;
using Chronicle.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Infrastructure.Data;

/// <summary>
/// The one DbContext: portfolio content plus ASP.NET Core Identity in a single
/// database, so the admin CMS and the public API share one connection and one migration
/// history.
/// </summary>
public class ChronicleDbContext(DbContextOptions<ChronicleDbContext> options)
    : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options), IChronicleDbContext
{
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Experience> Experiences => Set<Experience>();
    public DbSet<Post> Posts => Set<Post>();
    public DbSet<LearningItem> LearningItems => Set<LearningItem>();
    public DbSet<Skill> Skills => Set<Skill>();
    public DbSet<RoadmapItem> RoadmapItems => Set<RoadmapItem>();
    public DbSet<Certification> Certifications => Set<Certification>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<Media> Media => Set<Media>();
    public DbSet<SiteStatus> SiteStatuses => Set<SiteStatus>();
    public DbSet<GitHubStatsCache> GitHubStatsCaches => Set<GitHubStatsCache>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Every IEntityTypeConfiguration in this assembly. Configuration lives beside
        // the schema it describes rather than in one growing OnModelCreating.
        builder.ApplyConfigurationsFromAssembly(typeof(ChronicleDbContext).Assembly);

        // Keep Identity's tables out of the way of the content tables.
        foreach (var entity in builder.Model.GetEntityTypes()
                     .Where(e => e.ClrType.Namespace?.StartsWith(
                         "Microsoft.AspNetCore.Identity", StringComparison.Ordinal) == true))
        {
            entity.SetSchema("identity");
        }

        builder.Entity<ApplicationUser>(b =>
        {
            b.ToTable("Users", "identity");
            b.Property(u => u.DisplayName).HasMaxLength(100);
        });

        builder.Entity<IdentityRole<Guid>>(b => b.ToTable("Roles", "identity"));
    }
}
