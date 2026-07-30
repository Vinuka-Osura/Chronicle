using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Chronicle.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class ProjectMetrics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Metrics",
                table: "portfolio_projects",
                type: "jsonb",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Metrics",
                table: "portfolio_projects");
        }
    }
}
