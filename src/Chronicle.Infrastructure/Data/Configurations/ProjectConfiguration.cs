using Chronicle.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chronicle.Infrastructure.Data.Configurations;

public sealed class ProjectConfiguration : IEntityTypeConfiguration<Project>
{
    public void Configure(EntityTypeBuilder<Project> builder)
    {
        /*
          A named owner must carry the note that says publishing was agreed.

          Enforced by the database rather than only by the form, for the same reason the
          singleton rows are: this one is a claim about a third party on a public page, and
          "the admin UI requires it" is not a guarantee — a seeder, a migration or a direct
          UPDATE all bypass the form. The constraint means the pairing cannot be broken by
          any route.

          The reverse is allowed: a note with no owner is merely unused, not a claim.
        */
        builder.ToTable("portfolio_projects", t => t.HasCheckConstraint(
            "ck_portfolio_projects_owner_permission",
            @"""Owner"" IS NULL OR ""PermissionNote"" IS NOT NULL"));

        builder.Property(p => p.Title).IsRequired().HasMaxLength(200);
        builder.Property(p => p.Slug).IsRequired().HasMaxLength(200);
        builder.Property(p => p.Pitch).IsRequired().HasMaxLength(300);

        // Markdown bodies are unbounded text by design - a case study should never be
        // truncated by a column width chosen years earlier.
        builder.Property(p => p.Problem).IsRequired();
        builder.Property(p => p.Solution).IsRequired();

        builder.Property(p => p.ArchitectureDiagramUrl).HasMaxLength(500);
        // Enough for a couple of dozen edges. Past that the picture stops being a
        // diagram and becomes a map nobody reads, which is prose's job.
        builder.Property(p => p.ArchitectureDiagram).HasMaxLength(2000);

        // jsonb, for the same reason as portfolio_media.Metadata: an open shape that
        // varies per row and is only ever read alongside its owner.
        builder.OwnsMany(p => p.Metrics, metrics => metrics.ToJson());
        builder.Property(p => p.VideoUrl).HasMaxLength(500);
        builder.Property(p => p.GithubUrl).HasMaxLength(500);
        builder.Property(p => p.DemoUrl).HasMaxLength(500);
        builder.Property(p => p.DocsUrl).HasMaxLength(500);

        // Whose work this is. Owner length matches Company on portfolio_experiences, since
        // the same organisation is very often named in both.
        builder.Property(p => p.Owner).HasMaxLength(150);
        builder.Property(p => p.OwnerUrl).HasMaxLength(300);
        builder.Property(p => p.PermissionNote).HasMaxLength(300);
        builder.Property(p => p.EvidenceUrl).HasMaxLength(500);

        // Grouping the projects page by owner reads every non-null owner in slug order.
        builder.HasIndex(p => p.Owner);

        builder.HasIndex(p => p.Slug).IsUnique();

        // Matches the default ordering in GetProjectsQueryHandler, which is now
        // featured, then the editor's chosen order, then most recent.
        builder.HasIndex(p => new { p.Featured, p.SortOrder, p.StartDate })
            .HasDatabaseName("IX_Projects_Featured_SortOrder_StartDate")
            .IsDescending(true, false, true);

        builder.HasMany(p => p.Screenshots)
            .WithOne(m => m.Project)
            .HasForeignKey(m => m.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.Tags)
            .WithMany(t => t.Projects)
            .UsingEntity(j => j.ToTable("portfolio_project_tags"));

        builder.HasMany(p => p.TechStack)
            .WithMany(s => s.Projects)
            .UsingEntity(j => j.ToTable("portfolio_project_skills"));
    }
}
