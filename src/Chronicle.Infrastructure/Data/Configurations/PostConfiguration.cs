using Chronicle.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chronicle.Infrastructure.Data.Configurations;

public sealed class PostConfiguration : IEntityTypeConfiguration<Post>
{
    public void Configure(EntityTypeBuilder<Post> builder)
    {
        builder.ToTable("knowledge_posts");

        builder.Property(p => p.Title).IsRequired().HasMaxLength(200);
        builder.Property(p => p.Slug).IsRequired().HasMaxLength(200);
        builder.Property(p => p.Excerpt).IsRequired().HasMaxLength(300);
        builder.Property(p => p.BodyMarkdown).IsRequired();

        builder.HasIndex(p => p.Slug).IsUnique();

        // The public list filters on IsPublished and orders by PublishedAt desc.
        builder.HasIndex(p => new { p.IsPublished, p.PublishedAt })
            .HasDatabaseName("IX_Posts_IsPublished_PublishedAt")
            .IsDescending(false, true);

        builder.HasMany(p => p.Tags)
            .WithMany(t => t.Posts)
            .UsingEntity(j => j.ToTable("knowledge_post_tags"));
    }
}
