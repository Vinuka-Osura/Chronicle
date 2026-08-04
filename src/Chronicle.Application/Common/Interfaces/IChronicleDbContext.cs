using Chronicle.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Common.Interfaces;

/// <summary>
/// The persistence surface the Application layer is allowed to see.
/// </summary>
/// <remarks>
/// There is deliberately no generic <c>IRepository&lt;T&gt;</c> in this codebase.
/// EF Core's <see cref="DbContext"/> already is a repository and a unit of work;
/// wrapping it adds a layer of indirection while taking away <c>Include</c>,
/// projection and composable <c>IQueryable</c> - the things that make it worth using.
/// Exposing the <see cref="DbSet{TEntity}"/>s behind an interface keeps handlers
/// testable and keeps Infrastructure swappable, which is what the abstraction was
/// actually for.
/// </remarks>
public interface IChronicleDbContext
{
    DbSet<Project> Projects { get; }
    DbSet<Experience> Experiences { get; }
    DbSet<Post> Posts { get; }
    DbSet<LearningItem> LearningItems { get; }
    DbSet<Skill> Skills { get; }
    DbSet<RoadmapItem> RoadmapItems { get; }
    DbSet<Certification> Certifications { get; }
    DbSet<Era> Eras { get; }
    DbSet<Milestone> Milestones { get; }
    DbSet<Tag> Tags { get; }
    DbSet<Media> Media { get; }
    DbSet<SiteStatus> SiteStatuses { get; }
    DbSet<Profile> Profiles { get; }
    DbSet<GitHubStatsCache> GitHubStatsCaches { get; }
    DbSet<ExternalStatsCache> ExternalStatsCaches { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
