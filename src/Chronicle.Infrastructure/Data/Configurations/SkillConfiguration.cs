using Chronicle.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chronicle.Infrastructure.Data.Configurations;

public sealed class SkillConfiguration : IEntityTypeConfiguration<Skill>
{
    public void Configure(EntityTypeBuilder<Skill> builder)
    {
        builder.Property(s => s.Name).IsRequired().HasMaxLength(100);
        builder.HasIndex(s => s.Name).IsUnique();

        // 3 digits, 1 decimal: 0.5 through 99.9 years.
        builder.Property(s => s.YearsExperience).HasPrecision(3, 1);

        builder.HasIndex(s => new { s.Category, s.SortOrder });
    }
}
