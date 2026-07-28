using Chronicle.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chronicle.Infrastructure.Data.Configurations;

public sealed class MediaConfiguration : IEntityTypeConfiguration<Media>
{
    public void Configure(EntityTypeBuilder<Media> builder)
    {
        builder.Property(m => m.Url).IsRequired().HasMaxLength(500);
        builder.Property(m => m.Caption).HasMaxLength(200);

        builder.HasIndex(m => new { m.ProjectId, m.SortOrder });
    }
}
