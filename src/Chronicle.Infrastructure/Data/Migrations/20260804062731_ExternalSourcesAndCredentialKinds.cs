using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Chronicle.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class ExternalSourcesAndCredentialKinds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_profile_certifications_IssueDate",
                table: "profile_certifications");

            migrationBuilder.AddColumn<string>(
                name: "CredlyUsername",
                table: "site_profile",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DockerHubUsername",
                table: "site_profile",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GitHubUsername",
                table: "site_profile",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MediumUsername",
                table: "site_profile",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StackOverflowUserId",
                table: "site_profile",
                type: "character varying(40)",
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "ExpiryDate",
                table: "profile_certifications",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Kind",
                table: "profile_certifications",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "site_external_stats",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Provider = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    PayloadJson = table.Column<string>(type: "jsonb", nullable: false),
                    FetchedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_site_external_stats", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Certifications_Kind_IssueDate",
                table: "profile_certifications",
                columns: new[] { "Kind", "IssueDate" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_ExternalStats_Provider",
                table: "site_external_stats",
                column: "Provider",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "site_external_stats");

            migrationBuilder.DropIndex(
                name: "IX_Certifications_Kind_IssueDate",
                table: "profile_certifications");

            migrationBuilder.DropColumn(
                name: "CredlyUsername",
                table: "site_profile");

            migrationBuilder.DropColumn(
                name: "DockerHubUsername",
                table: "site_profile");

            migrationBuilder.DropColumn(
                name: "GitHubUsername",
                table: "site_profile");

            migrationBuilder.DropColumn(
                name: "MediumUsername",
                table: "site_profile");

            migrationBuilder.DropColumn(
                name: "StackOverflowUserId",
                table: "site_profile");

            migrationBuilder.DropColumn(
                name: "ExpiryDate",
                table: "profile_certifications");

            migrationBuilder.DropColumn(
                name: "Kind",
                table: "profile_certifications");

            migrationBuilder.CreateIndex(
                name: "IX_profile_certifications_IssueDate",
                table: "profile_certifications",
                column: "IssueDate",
                descending: new bool[0]);
        }
    }
}
