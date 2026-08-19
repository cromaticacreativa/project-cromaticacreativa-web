using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CromaticaCreativa.Modules.CompanyProfile.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCompanyProfileSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "company_profile");

            migrationBuilder.CreateTable(
                name: "company_profile",
                schema: "company_profile",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    singleton_key = table.Column<int>(type: "integer", nullable: false, defaultValue: 1)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_company_profile", x => x.id);
                    table.CheckConstraint("ck_company_profile_singleton_key", "singleton_key = 1");
                });

            migrationBuilder.CreateTable(
                name: "email",
                schema: "company_profile",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    company_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<string>(type: "text", nullable: false),
                    address = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_email", x => x.id);
                    table.CheckConstraint("ck_email_address", "length(btrim(address)) > 0");
                    table.CheckConstraint("ck_email_type", "type IN ('PUBLIC', 'CONTACT_REQUEST_RECIPIENT')");
                    table.ForeignKey(
                        name: "fk_email_company_profile",
                        column: x => x.company_profile_id,
                        principalSchema: "company_profile",
                        principalTable: "company_profile",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "location",
                schema: "company_profile",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    company_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    address = table.Column<string>(type: "text", nullable: false),
                    latitude = table.Column<double>(type: "double precision", nullable: true),
                    longitude = table.Column<double>(type: "double precision", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_location", x => x.id);
                    table.CheckConstraint("ck_location_address", "length(btrim(address)) > 0");
                    table.CheckConstraint("ck_location_coordinates_pair", "(latitude IS NULL AND longitude IS NULL) OR (latitude IS NOT NULL AND longitude IS NOT NULL)");
                    table.CheckConstraint("ck_location_latitude", "latitude IS NULL OR latitude BETWEEN -90 AND 90");
                    table.CheckConstraint("ck_location_longitude", "longitude IS NULL OR longitude BETWEEN -180 AND 180");
                    table.ForeignKey(
                        name: "fk_location_company_profile",
                        column: x => x.company_profile_id,
                        principalSchema: "company_profile",
                        principalTable: "company_profile",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "phone",
                schema: "company_profile",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    company_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<string>(type: "text", nullable: false),
                    number = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_phone", x => x.id);
                    table.CheckConstraint("ck_phone_number", "length(btrim(number)) > 0");
                    table.CheckConstraint("ck_phone_type", "type IN ('PHONE', 'WHATSAPP')");
                    table.ForeignKey(
                        name: "fk_phone_company_profile",
                        column: x => x.company_profile_id,
                        principalSchema: "company_profile",
                        principalTable: "company_profile",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "social_link",
                schema: "company_profile",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    company_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    network = table.Column<string>(type: "text", nullable: false),
                    url = table.Column<string>(type: "text", nullable: false),
                    display_order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_social_link", x => x.id);
                    table.CheckConstraint("ck_social_link_display_order", "display_order >= 0");
                    table.CheckConstraint("ck_social_link_network", "length(btrim(network)) > 0");
                    table.CheckConstraint("ck_social_link_url", "length(btrim(url)) > 0");
                    table.ForeignKey(
                        name: "fk_social_link_company_profile",
                        column: x => x.company_profile_id,
                        principalSchema: "company_profile",
                        principalTable: "company_profile",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "uq_company_profile_singleton_key",
                schema: "company_profile",
                table: "company_profile",
                column: "singleton_key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_email_company_profile_id_type",
                schema: "company_profile",
                table: "email",
                columns: new[] { "company_profile_id", "type" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_location_company_profile_id",
                schema: "company_profile",
                table: "location",
                column: "company_profile_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_phone_company_profile_id_type",
                schema: "company_profile",
                table: "phone",
                columns: new[] { "company_profile_id", "type" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_social_link_company_profile_id_network",
                schema: "company_profile",
                table: "social_link",
                columns: new[] { "company_profile_id", "network" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "email",
                schema: "company_profile");

            migrationBuilder.DropTable(
                name: "location",
                schema: "company_profile");

            migrationBuilder.DropTable(
                name: "phone",
                schema: "company_profile");

            migrationBuilder.DropTable(
                name: "social_link",
                schema: "company_profile");

            migrationBuilder.DropTable(
                name: "company_profile",
                schema: "company_profile");
        }
    }
}
