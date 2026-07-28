using Chronicle.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chronicle.Infrastructure.Data.Configurations;

public sealed class ExperienceConfiguration : IEntityTypeConfiguration<Experience>
{
    public void Configure(EntityTypeBuilder<Experience> builder)
    {
        builder.ToTable("portfolio_experiences");

        builder.Property(e => e.Role).IsRequired().HasMaxLength(150);
        builder.Property(e => e.Company).IsRequired().HasMaxLength(150);
        builder.Property(e => e.Summary).IsRequired();

        // EF Core maps a primitive collection to a single JSON column, which the
        // Npgsql provider stores as jsonb. Highlights are only ever read and written
        // as a whole list, so a join table would buy nothing.
        builder.Property(e => e.Highlights).HasColumnType("jsonb");

        builder.HasIndex(e => e.StartDate).IsDescending();

        builder.HasMany(e => e.TechStack)
            .WithMany(s => s.Experiences)
            .UsingEntity(j => j.ToTable("portfolio_experience_skills"));
    }
}
