using Chronicle.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chronicle.Infrastructure.Data.Configurations;

public sealed class CertificationConfiguration : IEntityTypeConfiguration<Certification>
{
    public void Configure(EntityTypeBuilder<Certification> builder)
    {
        builder.Property(c => c.Name).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Issuer).IsRequired().HasMaxLength(150);
        builder.Property(c => c.CredentialUrl).HasMaxLength(500);
        builder.Property(c => c.LogoUrl).HasMaxLength(500);

        builder.HasIndex(c => c.IssueDate).IsDescending();
    }
}
