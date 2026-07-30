using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Chronicle.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class MediaStorageDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ContentType",
                table: "portfolio_media",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Metadata",
                table: "portfolio_media",
                type: "jsonb",
                nullable: false,
                defaultValue: "{}");

            migrationBuilder.AddColumn<long>(
                name: "SizeBytes",
                table: "portfolio_media",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<string>(
                name: "StorageKey",
                table: "portfolio_media",
                type: "character varying(300)",
                maxLength: 300,
                nullable: false,
                defaultValue: "");

            // Backfill before the unique index goes on. Existing rows predate object
            // storage — they point at external URLs and have no key of ours — so they all
            // default to '' and any two of them would collide. Seeding from the primary
            // key gives each a distinct value, and the "external:" prefix says plainly
            // that there is no object behind it for a delete to remove.
            migrationBuilder.Sql(
                """
                UPDATE portfolio_media
                SET "StorageKey" = 'external:' || "Id"
                WHERE "StorageKey" = '';
                """);

            migrationBuilder.CreateIndex(
                name: "IX_portfolio_media_StorageKey",
                table: "portfolio_media",
                column: "StorageKey",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_portfolio_media_StorageKey",
                table: "portfolio_media");

            migrationBuilder.DropColumn(
                name: "ContentType",
                table: "portfolio_media");

            migrationBuilder.DropColumn(
                name: "Metadata",
                table: "portfolio_media");

            migrationBuilder.DropColumn(
                name: "SizeBytes",
                table: "portfolio_media");

            migrationBuilder.DropColumn(
                name: "StorageKey",
                table: "portfolio_media");
        }
    }
}
