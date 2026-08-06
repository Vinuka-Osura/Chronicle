using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Chronicle.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class ProjectOwnership : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EvidenceUrl",
                table: "portfolio_projects",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Owner",
                table: "portfolio_projects",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OwnerUrl",
                table: "portfolio_projects",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PermissionNote",
                table: "portfolio_projects",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_portfolio_projects_Owner",
                table: "portfolio_projects",
                column: "Owner");

            migrationBuilder.AddCheckConstraint(
                name: "ck_portfolio_projects_owner_permission",
                table: "portfolio_projects",
                sql: "\"Owner\" IS NULL OR \"PermissionNote\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_portfolio_projects_Owner",
                table: "portfolio_projects");

            migrationBuilder.DropCheckConstraint(
                name: "ck_portfolio_projects_owner_permission",
                table: "portfolio_projects");

            migrationBuilder.DropColumn(
                name: "EvidenceUrl",
                table: "portfolio_projects");

            migrationBuilder.DropColumn(
                name: "Owner",
                table: "portfolio_projects");

            migrationBuilder.DropColumn(
                name: "OwnerUrl",
                table: "portfolio_projects");

            migrationBuilder.DropColumn(
                name: "PermissionNote",
                table: "portfolio_projects");
        }
    }
}
