using Chronicle.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chronicle.Infrastructure.Data.Configurations;

public sealed class MediaConfiguration : IEntityTypeConfiguration<Media>
{
    public void Configure(EntityTypeBuilder<Media> builder)
    {
        builder.ToTable("portfolio_media");

        builder.Property(m => m.Url).IsRequired().HasMaxLength(500);
        builder.Property(m => m.StorageKey).IsRequired().HasMaxLength(300);
        builder.Property(m => m.ContentType).IsRequired().HasMaxLength(100);
        builder.Property(m => m.Caption).HasMaxLength(200);

        // Unique, so one object cannot be recorded twice and then half-deleted: the
        // first delete would remove the file and leave the second row pointing at
        // nothing.
        builder.HasIndex(m => m.StorageKey).IsUnique();

        /*
          jsonb, not a column each. Width, height and the original filename are what we
          want today; a dominant colour or a blurhash is exactly the sort of thing added
          later, and as separate columns each of those is a migration plus another
          mostly-null column. PostgreSQL indexes and queries jsonb properly, so nothing
          is given up. See docs/technical-decisions.md section 2.
        */
        builder.OwnsOne(m => m.Metadata, metadata => metadata.ToJson());

        builder.HasIndex(m => new { m.ProjectId, m.SortOrder });
    }
}
