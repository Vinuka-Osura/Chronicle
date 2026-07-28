using Chronicle.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chronicle.Infrastructure.Data.Configurations;

public sealed class ProjectConfiguration : IEntityTypeConfiguration<Project>
{
    public void Configure(EntityTypeBuilder<Project> builder)
    {
        builder.ToTable("portfolio_projects");

        builder.Property(p => p.Title).IsRequired().HasMaxLength(200);
        builder.Property(p => p.Slug).IsRequired().HasMaxLength(200);
        builder.Property(p => p.Pitch).IsRequired().HasMaxLength(300);

        // Markdown bodies are unbounded text by design - a case study should never be
        // truncated by a column width chosen years earlier.
        builder.Property(p => p.Problem).IsRequired();
        builder.Property(p => p.Solution).IsRequired();

        builder.Property(p => p.ArchitectureDiagramUrl).HasMaxLength(500);
        builder.Property(p => p.VideoUrl).HasMaxLength(500);
        builder.Property(p => p.GithubUrl).HasMaxLength(500);
        builder.Property(p => p.DemoUrl).HasMaxLength(500);
        builder.Property(p => p.DocsUrl).HasMaxLength(500);

        builder.HasIndex(p => p.Slug).IsUnique();

        // Matches the default ordering in GetProjectsQueryHandler.
        builder.HasIndex(p => new { p.Featured, p.StartDate })
            .HasDatabaseName("IX_Projects_Featured_StartDate")
            .IsDescending(false, true);

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
