using Chronicle.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chronicle.Infrastructure.Data.Configurations;

public sealed class LearningItemConfiguration : IEntityTypeConfiguration<LearningItem>
{
    public void Configure(EntityTypeBuilder<LearningItem> builder)
    {
        builder.Property(l => l.Topic).IsRequired().HasMaxLength(150);
        builder.Property(l => l.Note).IsRequired().HasMaxLength(500);
        builder.Property(l => l.Link).HasMaxLength(500);

        // The UI renders this as a percentage meter; anything outside 0-100 would be
        // a rendering bug rather than data, so the database refuses it outright.
        builder.ToTable("knowledge_learning_items", t => t.HasCheckConstraint(
            "ck_knowledge_learning_items_progress_percent",
            "\"ProgressPercent\" IS NULL OR (\"ProgressPercent\" BETWEEN 0 AND 100)"));

        builder.HasIndex(l => l.SortOrder);
    }
}
