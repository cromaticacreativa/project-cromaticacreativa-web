using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CromaticaCreativa.Modules.Services.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialServicesSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "services");

            migrationBuilder.CreateTable(
                name: "service",
                schema: "services",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: false),
                    image_reference = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    display_order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_service", x => x.id);
                    table.CheckConstraint("ck_service_display_order", "display_order >= 0");
                    table.CheckConstraint("ck_service_image_reference", "length(btrim(image_reference)) > 0");
                    table.CheckConstraint("ck_service_name", "length(btrim(name)) > 0");
                    table.CheckConstraint("ck_service_status", "status IN ('ACTIVE', 'INACTIVE')");
                });

            migrationBuilder.CreateTable(
                name: "category",
                schema: "services",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    service_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: false),
                    reference_image = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    display_order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_category", x => x.id);
                    table.CheckConstraint("ck_category_display_order", "display_order >= 0");
                    table.CheckConstraint("ck_category_name", "length(btrim(name)) > 0");
                    table.CheckConstraint("ck_category_reference_image", "length(btrim(reference_image)) > 0");
                    table.CheckConstraint("ck_category_status", "status IN ('ACTIVE', 'INACTIVE')");
                    table.ForeignKey(
                        name: "fk_category_service",
                        column: x => x.service_id,
                        principalSchema: "services",
                        principalTable: "service",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_category_service_id_status",
                schema: "services",
                table: "category",
                columns: new[] { "service_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ix_category_status",
                schema: "services",
                table: "category",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "uq_category_service_id_name",
                schema: "services",
                table: "category",
                columns: new[] { "service_id", "name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_service_status",
                schema: "services",
                table: "service",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "uq_service_name",
                schema: "services",
                table: "service",
                column: "name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "category",
                schema: "services");

            migrationBuilder.DropTable(
                name: "service",
                schema: "services");
        }
    }
}
