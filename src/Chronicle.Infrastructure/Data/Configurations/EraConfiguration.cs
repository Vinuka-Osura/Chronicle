using Chronicle.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chronicle.Infrastructure.Data.Configurations;

public sealed class EraConfiguration : IEntityTypeConfiguration<Era>
{
    public void Configure(EntityTypeBuilder<Era> builder)
    {
        builder.ToTable("profile_eras");

        builder.Property(e => e.Name).IsRequired().HasMaxLength(80);
        builder.Property(e => e.Tagline).HasMaxLength(160);

        // The timeline reads eras in chronological order and asks "which era covers this
        // date?" for every item, so the start date is the access path.
        builder.HasIndex(e => e.StartDate);

        builder.ToTable(t => t.HasCheckConstraint(
            "ck_profile_eras_dates",
            "\"EndDate\" IS NULL OR \"EndDate\" >= \"StartDate\""));
    }
}
