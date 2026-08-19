using CromaticaCreativa.Modules.Services.Infrastructure.Persistence.Context;
using CromaticaCreativa.Modules.Services.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CromaticaCreativa.Modules.Services.Infrastructure.Persistence.Configurations;

internal sealed class ServiceConfiguration : IEntityTypeConfiguration<ServiceModel>
{
    public void Configure(EntityTypeBuilder<ServiceModel> builder)
    {
        builder.ToTable(
            "service",
            ServicesDbContext.Schema,
            table =>
            {
                table.HasCheckConstraint("ck_service_name", "length(btrim(name)) > 0");
                table.HasCheckConstraint("ck_service_image_reference", "length(btrim(image_reference)) > 0");
                table.HasCheckConstraint("ck_service_status", "status IN ('ACTIVE', 'INACTIVE')");
                table.HasCheckConstraint("ck_service_display_order", "display_order >= 0");
            });

        builder.HasKey(model => model.Id).HasName("pk_service");

        builder.Property(model => model.Id).HasColumnName("id").HasColumnType("uuid").IsRequired();
        builder.Property(model => model.Name).HasColumnName("name").HasColumnType("text").IsRequired();
        builder.Property(model => model.Description).HasColumnName("description").HasColumnType("text").IsRequired();
        builder.Property(model => model.ImageReference).HasColumnName("image_reference").HasColumnType("text").IsRequired();
        builder.Property(model => model.Status).HasColumnName("status").HasColumnType("text").IsRequired();
        builder.Property(model => model.DisplayOrder).HasColumnName("display_order").HasColumnType("integer").IsRequired();

        builder.HasIndex(model => model.Name).IsUnique().HasDatabaseName("uq_service_name");
        builder.HasIndex(model => model.Status).HasDatabaseName("ix_service_status");
    }
}
