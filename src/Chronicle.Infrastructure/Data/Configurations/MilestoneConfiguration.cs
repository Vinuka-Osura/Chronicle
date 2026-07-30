using Chronicle.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chronicle.Infrastructure.Data.Configurations;

public sealed class MilestoneConfiguration : IEntityTypeConfiguration<Milestone>
{
    public void Configure(EntityTypeBuilder<Milestone> builder)
    {
        builder.ToTable("profile_milestones");

        builder.Property(m => m.Title).IsRequired().HasMaxLength(150);
        builder.Property(m => m.Description).IsRequired().HasMaxLength(500);
        builder.Property(m => m.Link).HasMaxLength(500);

        builder.HasIndex(m => m.Date);

        builder.ToTable(t => t.HasCheckConstraint(
            "ck_profile_milestones_dates",
            "\"EndDate\" IS NULL OR \"EndDate\" >= \"Date\""));
    }
}
