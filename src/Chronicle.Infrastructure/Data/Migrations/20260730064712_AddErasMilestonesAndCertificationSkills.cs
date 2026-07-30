using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Chronicle.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddErasMilestonesAndCertificationSkills : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "profile_certification_skills",
                columns: table => new
                {
                    CertificationsId = table.Column<Guid>(type: "uuid", nullable: false),
                    SkillsId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_profile_certification_skills", x => new { x.CertificationsId, x.SkillsId });
                    table.ForeignKey(
                        name: "FK_profile_certification_skills_profile_certifications_Certifi~",
                        column: x => x.CertificationsId,
                        principalTable: "profile_certifications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_profile_certification_skills_profile_skills_SkillsId",
                        column: x => x.SkillsId,
                        principalTable: "profile_skills",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "profile_eras",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Tagline = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_profile_eras", x => x.Id);
                    table.CheckConstraint("ck_profile_eras_dates", "\"EndDate\" IS NULL OR \"EndDate\" >= \"StartDate\"");
                });

            migrationBuilder.CreateTable(
                name: "profile_milestones",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Category = table.Column<int>(type: "integer", nullable: false),
                    Link = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_profile_milestones", x => x.Id);
                    table.CheckConstraint("ck_profile_milestones_dates", "\"EndDate\" IS NULL OR \"EndDate\" >= \"Date\"");
                });

            migrationBuilder.CreateIndex(
                name: "IX_profile_certification_skills_SkillsId",
                table: "profile_certification_skills",
                column: "SkillsId");

            migrationBuilder.CreateIndex(
                name: "IX_profile_eras_StartDate",
                table: "profile_eras",
                column: "StartDate");

            migrationBuilder.CreateIndex(
                name: "IX_profile_milestones_Date",
                table: "profile_milestones",
                column: "Date");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "profile_certification_skills");

            migrationBuilder.DropTable(
                name: "profile_eras");

            migrationBuilder.DropTable(
                name: "profile_milestones");
        }
    }
}
