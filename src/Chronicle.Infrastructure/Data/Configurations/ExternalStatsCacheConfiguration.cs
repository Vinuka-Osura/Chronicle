using Chronicle.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chronicle.Infrastructure.Data.Configurations;

public sealed class ExternalStatsCacheConfiguration : IEntityTypeConfiguration<ExternalStatsCache>
{
    public void Configure(EntityTypeBuilder<ExternalStatsCache> builder)
    {
        builder.ToTable("site_external_stats");

        builder.Property(c => c.Provider).IsRequired().HasMaxLength(40);
        builder.Property(c => c.PayloadJson).IsRequired().HasColumnType("jsonb");

        // One row per service, enforced rather than trusted. This is the unique index doing
        // the job the old per-table check constraint did: nothing can leave two cached
        // payloads for the same provider and an ambiguous answer to "what did it say?".
        builder.HasIndex(c => c.Provider)
            .IsUnique()
            .HasDatabaseName("IX_ExternalStats_Provider");
    }
}
