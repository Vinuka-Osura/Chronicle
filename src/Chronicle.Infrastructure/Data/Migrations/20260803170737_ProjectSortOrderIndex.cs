using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Chronicle.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class ProjectSortOrderIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Projects_Featured_StartDate",
                table: "portfolio_projects");

            migrationBuilder.CreateIndex(
                name: "IX_Projects_Featured_SortOrder_StartDate",
                table: "portfolio_projects",
                columns: new[] { "Featured", "SortOrder", "StartDate" },
                descending: new[] { true, false, true });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Projects_Featured_SortOrder_StartDate",
                table: "portfolio_projects");

            migrationBuilder.CreateIndex(
                name: "IX_Projects_Featured_StartDate",
                table: "portfolio_projects",
                columns: new[] { "Featured", "StartDate" },
                descending: new[] { false, true });
        }
    }
}
