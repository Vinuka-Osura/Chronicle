using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Chronicle.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class ProfileSingleton : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "site_profile",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FullName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Headline = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Summary = table.Column<string>(type: "character varying(900)", maxLength: 900, nullable: false),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Phone = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    Location = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    LinkedInUrl = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    GitHubUrl = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    WebsiteUrl = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    Availability = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_site_profile", x => x.Id);
                    table.CheckConstraint("ck_site_profile_singleton", "\"Id\" = '0195c0de-0000-7000-8000-000000000002'");
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "site_profile");
        }
    }
}
