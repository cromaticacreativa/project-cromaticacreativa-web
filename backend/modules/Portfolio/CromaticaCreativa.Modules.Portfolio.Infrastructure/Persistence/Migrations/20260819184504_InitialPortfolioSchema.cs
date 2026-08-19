using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CromaticaCreativa.Modules.Portfolio.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialPortfolioSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "portfolio");

            migrationBuilder.CreateTable(
                name: "corporate_client",
                schema: "portfolio",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    logo_reference = table.Column<string>(type: "text", nullable: false),
                    visibility_status = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_corporate_client", x => x.id);
                    table.CheckConstraint("ck_corporate_client_logo_reference", "length(btrim(logo_reference)) > 0");
                    table.CheckConstraint("ck_corporate_client_name", "length(btrim(name)) > 0");
                    table.CheckConstraint("ck_corporate_client_visibility_status", "visibility_status IN ('VISIBLE', 'HIDDEN')");
                });

            migrationBuilder.CreateTable(
                name: "project",
                schema: "portfolio",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "text", nullable: true),
                    description = table.Column<string>(type: "text", nullable: false),
                    publication_status = table.Column<string>(type: "text", nullable: false),
                    display_order = table.Column<int>(type: "integer", nullable: false),
                    corporate_client_id = table.Column<Guid>(type: "uuid", nullable: true),
                    service_id = table.Column<Guid>(type: "uuid", nullable: false),
                    category_id = table.Column<Guid>(type: "uuid", nullable: false),
                    start_date = table.Column<DateOnly>(type: "date", nullable: false),
                    end_date = table.Column<DateOnly>(type: "date", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_project", x => x.id);
                    table.CheckConstraint("ck_project_display_order", "display_order >= 0");
                    table.CheckConstraint("ck_project_period", "end_date >= start_date");
                    table.CheckConstraint("ck_project_publication_status", "publication_status IN ('DRAFT', 'PUBLISHED')");
                    table.CheckConstraint("ck_project_published_title", "publication_status <> 'PUBLISHED' OR (title IS NOT NULL AND length(btrim(title)) > 0)");
                    table.CheckConstraint("ck_project_title", "title IS NULL OR length(btrim(title)) > 0");
                    table.ForeignKey(
                        name: "fk_project_corporate_client",
                        column: x => x.corporate_client_id,
                        principalSchema: "portfolio",
                        principalTable: "corporate_client",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "media",
                schema: "portfolio",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    project_id = table.Column<Guid>(type: "uuid", nullable: false),
                    reference = table.Column<string>(type: "text", nullable: false),
                    type = table.Column<string>(type: "text", nullable: false),
                    display_order = table.Column<int>(type: "integer", nullable: false),
                    is_cover = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_media", x => x.id);
                    table.CheckConstraint("ck_media_display_order", "display_order >= 0");
                    table.CheckConstraint("ck_media_reference", "length(btrim(reference)) > 0");
                    table.CheckConstraint("ck_media_type", "type IN ('IMAGE', 'VIDEO')");
                    table.ForeignKey(
                        name: "fk_media_project",
                        column: x => x.project_id,
                        principalSchema: "portfolio",
                        principalTable: "project",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_corporate_client_visibility_status",
                schema: "portfolio",
                table: "corporate_client",
                column: "visibility_status");

            migrationBuilder.CreateIndex(
                name: "uq_corporate_client_name",
                schema: "portfolio",
                table: "corporate_client",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_media_project_id",
                schema: "portfolio",
                table: "media",
                column: "project_id");

            migrationBuilder.CreateIndex(
                name: "uq_media_project_cover",
                schema: "portfolio",
                table: "media",
                column: "project_id",
                unique: true,
                filter: "is_cover = true");

            migrationBuilder.CreateIndex(
                name: "ix_project_category_id",
                schema: "portfolio",
                table: "project",
                column: "category_id");

            migrationBuilder.CreateIndex(
                name: "ix_project_corporate_client_id",
                schema: "portfolio",
                table: "project",
                column: "corporate_client_id");

            migrationBuilder.CreateIndex(
                name: "ix_project_publication_status",
                schema: "portfolio",
                table: "project",
                column: "publication_status");

            migrationBuilder.CreateIndex(
                name: "ix_project_publication_status_service_id_category_id",
                schema: "portfolio",
                table: "project",
                columns: new[] { "publication_status", "service_id", "category_id" });

            migrationBuilder.CreateIndex(
                name: "ix_project_service_id",
                schema: "portfolio",
                table: "project",
                column: "service_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "media",
                schema: "portfolio");

            migrationBuilder.DropTable(
                name: "project",
                schema: "portfolio");

            migrationBuilder.DropTable(
                name: "corporate_client",
                schema: "portfolio");
        }
    }
}
