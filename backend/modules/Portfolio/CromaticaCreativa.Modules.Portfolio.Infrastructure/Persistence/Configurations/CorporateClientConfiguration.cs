using CromaticaCreativa.Modules.Portfolio.Infrastructure.Persistence.Context;
using CromaticaCreativa.Modules.Portfolio.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CromaticaCreativa.Modules.Portfolio.Infrastructure.Persistence.Configurations;

internal sealed class CorporateClientConfiguration : IEntityTypeConfiguration<CorporateClientModel>
{
    public void Configure(EntityTypeBuilder<CorporateClientModel> builder)
    {
        builder.ToTable(
            "corporate_client",
            PortfolioDbContext.Schema,
            table =>
            {
                table.HasCheckConstraint("ck_corporate_client_name", "length(btrim(name)) > 0");
                table.HasCheckConstraint("ck_corporate_client_logo_reference", "length(btrim(logo_reference)) > 0");
                table.HasCheckConstraint(
                    "ck_corporate_client_visibility_status",
                    "visibility_status IN ('VISIBLE', 'HIDDEN')");
            });

        builder.HasKey(model => model.Id).HasName("pk_corporate_client");

        builder.Property(model => model.Id).HasColumnName("id").HasColumnType("uuid").IsRequired();
        builder.Property(model => model.Name).HasColumnName("name").HasColumnType("text").IsRequired();
        builder.Property(model => model.LogoReference).HasColumnName("logo_reference").HasColumnType("text").IsRequired();
        builder.Property(model => model.VisibilityStatus).HasColumnName("visibility_status").HasColumnType("text").IsRequired();

        builder.HasIndex(model => model.Name).IsUnique().HasDatabaseName("uq_corporate_client_name");
        builder.HasIndex(model => model.VisibilityStatus).HasDatabaseName("ix_corporate_client_visibility_status");
    }
}
