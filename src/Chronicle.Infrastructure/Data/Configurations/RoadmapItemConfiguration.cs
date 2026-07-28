using Chronicle.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chronicle.Infrastructure.Data.Configurations;

public sealed class RoadmapItemConfiguration : IEntityTypeConfiguration<RoadmapItem>
{
    public void Configure(EntityTypeBuilder<RoadmapItem> builder)
    {
        builder.Property(r => r.Title).IsRequired().HasMaxLength(150);
        builder.Property(r => r.Description).IsRequired().HasMaxLength(500);

        // The Timeline reads these in target-date order, below the "today" marker.
        builder.HasIndex(r => r.TargetDate);
    }
}
