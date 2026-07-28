using Chronicle.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chronicle.Infrastructure.Data.Configurations;

public sealed class GitHubStatsCacheConfiguration : IEntityTypeConfiguration<GitHubStatsCache>
{
    public void Configure(EntityTypeBuilder<GitHubStatsCache> builder)
    {
        builder.Property(g => g.PayloadJson).IsRequired().HasColumnType("jsonb");

        builder.ToTable(t => t.HasCheckConstraint(
            "CK_GitHubStatsCaches_Singleton",
            $"\"Id\" = '{GitHubStatsCache.SingletonId}'"));
    }
}
