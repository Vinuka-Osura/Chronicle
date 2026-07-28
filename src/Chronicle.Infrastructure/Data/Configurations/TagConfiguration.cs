using Chronicle.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chronicle.Infrastructure.Data.Configurations;

public sealed class TagConfiguration : IEntityTypeConfiguration<Tag>
{
    public void Configure(EntityTypeBuilder<Tag> builder)
    {
        builder.ToTable("shared_tags");

        builder.Property(t => t.Name).IsRequired().HasMaxLength(60);
        builder.Property(t => t.Slug).IsRequired().HasMaxLength(60);
        builder.Property(t => t.Category).HasMaxLength(60);

        builder.HasIndex(t => t.Slug).IsUnique();
    }
}
