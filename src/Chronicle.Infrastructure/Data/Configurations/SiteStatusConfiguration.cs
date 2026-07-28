using Chronicle.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chronicle.Infrastructure.Data.Configurations;

public sealed class SiteStatusConfiguration : IEntityTypeConfiguration<SiteStatus>
{
    public void Configure(EntityTypeBuilder<SiteStatus> builder)
    {
        builder.Property(s => s.CurrentFocus).IsRequired().HasMaxLength(200);
        builder.Property(s => s.Mood).HasMaxLength(60);

        // Single-row table. The check constraint is what actually enforces it: the
        // admin screen only offers an edit form, but a stray insert from a migration
        // or a console would otherwise leave two rows and an ambiguous status strip.
        builder.ToTable(t => t.HasCheckConstraint(
            "CK_SiteStatuses_Singleton",
            $"\"Id\" = '{SiteStatus.SingletonId}'"));
    }
}
