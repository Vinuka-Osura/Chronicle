using Chronicle.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chronicle.Infrastructure.Data.Configurations;

public sealed class ProfileConfiguration : IEntityTypeConfiguration<Profile>
{
    public void Configure(EntityTypeBuilder<Profile> builder)
    {
        builder.Property(p => p.FullName).IsRequired().HasMaxLength(120);
        builder.Property(p => p.Headline).IsRequired().HasMaxLength(160);

        // Long enough for four sentences and no longer. A summary that runs past this is
        // not a summary, and the whole first page of the CV is the cost of finding out.
        builder.Property(p => p.Summary).IsRequired().HasMaxLength(900);

        builder.Property(p => p.Email).IsRequired().HasMaxLength(200);
        builder.Property(p => p.Phone).HasMaxLength(40);
        builder.Property(p => p.Location).HasMaxLength(120);
        builder.Property(p => p.LinkedInUrl).HasMaxLength(300);
        builder.Property(p => p.GitHubUrl).HasMaxLength(300);
        builder.Property(p => p.WebsiteUrl).HasMaxLength(300);
        builder.Property(p => p.Availability).HasMaxLength(300);

        // Single-row table, enforced the same way site_status is: the admin screen offers
        // only an edit form, but a stray insert would otherwise leave two people on one CV.
        builder.ToTable("site_profile", t => t.HasCheckConstraint(
            "ck_site_profile_singleton",
            $"\"Id\" = '{Profile.SingletonId}'"));
    }
}
