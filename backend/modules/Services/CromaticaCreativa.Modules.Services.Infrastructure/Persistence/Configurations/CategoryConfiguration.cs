using CromaticaCreativa.Modules.Services.Infrastructure.Persistence.Context;
using CromaticaCreativa.Modules.Services.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CromaticaCreativa.Modules.Services.Infrastructure.Persistence.Configurations;

internal sealed class CategoryConfiguration : IEntityTypeConfiguration<CategoryModel>
{
    public void Configure(EntityTypeBuilder<CategoryModel> builder)
    {
        builder.ToTable(
            "category",
            ServicesDbContext.Schema,
            table =>
            {
                table.HasCheckConstraint("ck_category_name", "length(btrim(name)) > 0");
                table.HasCheckConstraint("ck_category_reference_image", "length(btrim(reference_image)) > 0");
                table.HasCheckConstraint("ck_category_status", "status IN ('ACTIVE', 'INACTIVE')");
                table.HasCheckConstraint("ck_category_display_order", "display_order >= 0");
            });

        builder.HasKey(model => model.Id).HasName("pk_category");

        builder.Property(model => model.Id).HasColumnName("id").HasColumnType("uuid").IsRequired();
        builder.Property(model => model.ServiceId).HasColumnName("service_id").HasColumnType("uuid").IsRequired();
        builder.Property(model => model.Name).HasColumnName("name").HasColumnType("text").IsRequired();
        builder.Property(model => model.Description).HasColumnName("description").HasColumnType("text").IsRequired();
        builder.Property(model => model.ReferenceImage).HasColumnName("reference_image").HasColumnType("text").IsRequired();
        builder.Property(model => model.Status).HasColumnName("status").HasColumnType("text").IsRequired();
        builder.Property(model => model.DisplayOrder).HasColumnName("display_order").HasColumnType("integer").IsRequired();

        builder.HasOne(model => model.Service)
            .WithMany(model => model.Categories)
            .HasForeignKey(model => model.ServiceId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_category_service");

        builder.HasIndex(model => new { model.ServiceId, model.Name })
            .IsUnique()
            .HasDatabaseName("uq_category_service_id_name");
        builder.HasIndex(model => model.Status).HasDatabaseName("ix_category_status");
        builder.HasIndex(model => new { model.ServiceId, model.Status })
            .HasDatabaseName("ix_category_service_id_status");
    }
}
