using Chronicle.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chronicle.Infrastructure.Data.Configurations;

public sealed class CertificationConfiguration : IEntityTypeConfiguration<Certification>
{
    public void Configure(EntityTypeBuilder<Certification> builder)
    {
        builder.ToTable("profile_certifications");

        builder.Property(c => c.Name).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Issuer).IsRequired().HasMaxLength(150);
        builder.Property(c => c.CredentialUrl).HasMaxLength(500);
        builder.Property(c => c.LogoUrl).HasMaxLength(500);

        // Kind first, then most recent. Certifications outrank Applied Skills, which
        // outrank badges and training — the order the page and the CV both read in, so
        // neither has to sort it again.
        builder.HasIndex(c => new { c.Kind, c.IssueDate })
            .IsDescending(false, true)
            .HasDatabaseName("IX_Certifications_Kind_IssueDate");

        // What makes a certification a node with outgoing edges on the timeline rather
        // than a dead end.
        builder.HasMany(c => c.Skills)
            .WithMany(s => s.Certifications)
            .UsingEntity(j => j.ToTable("profile_certification_skills"));
    }
}
