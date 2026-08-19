using CromaticaCreativa.Modules.Portfolio.Infrastructure.Persistence.Context;
using CromaticaCreativa.Modules.Portfolio.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CromaticaCreativa.Modules.Portfolio.Infrastructure.Persistence.Configurations;

internal sealed class ProjectConfiguration : IEntityTypeConfiguration<ProjectModel>
{
    public void Configure(EntityTypeBuilder<ProjectModel> builder)
    {
        builder.ToTable(
            "project",
            PortfolioDbContext.Schema,
            table =>
            {
                table.HasCheckConstraint("ck_project_title", "title IS NULL OR length(btrim(title)) > 0");
                table.HasCheckConstraint(
                    "ck_project_published_title",
                    "publication_status <> 'PUBLISHED' OR (title IS NOT NULL AND length(btrim(title)) > 0)");
                table.HasCheckConstraint(
                    "ck_project_publication_status",
                    "publication_status IN ('DRAFT', 'PUBLISHED')");
                table.HasCheckConstraint("ck_project_display_order", "display_order >= 0");
                table.HasCheckConstraint("ck_project_period", "end_date >= start_date");
            });

        builder.HasKey(model => model.Id).HasName("pk_project");

        builder.Property(model => model.Id).HasColumnName("id").HasColumnType("uuid").IsRequired();
        builder.Property(model => model.Title).HasColumnName("title").HasColumnType("text");
        builder.Property(model => model.Description).HasColumnName("description").HasColumnType("text").IsRequired();
        builder.Property(model => model.PublicationStatus).HasColumnName("publication_status").HasColumnType("text").IsRequired();
        builder.Property(model => model.DisplayOrder).HasColumnName("display_order").HasColumnType("integer").IsRequired();
        builder.Property(model => model.CorporateClientId).HasColumnName("corporate_client_id").HasColumnType("uuid");
        builder.Property(model => model.ServiceId).HasColumnName("service_id").HasColumnType("uuid").IsRequired();
        builder.Property(model => model.CategoryId).HasColumnName("category_id").HasColumnType("uuid").IsRequired();
        builder.Property(model => model.StartDate).HasColumnName("start_date").HasColumnType("date").IsRequired();
        builder.Property(model => model.EndDate).HasColumnName("end_date").HasColumnType("date").IsRequired();

        builder.HasOne(model => model.CorporateClient)
            .WithMany(model => model.Projects)
            .HasForeignKey(model => model.CorporateClientId)
            .OnDelete(DeleteBehavior.Restrict)
            .HasConstraintName("fk_project_corporate_client");

        builder.HasIndex(model => model.PublicationStatus).HasDatabaseName("ix_project_publication_status");
        builder.HasIndex(model => model.CorporateClientId).HasDatabaseName("ix_project_corporate_client_id");
        builder.HasIndex(model => model.ServiceId).HasDatabaseName("ix_project_service_id");
        builder.HasIndex(model => model.CategoryId).HasDatabaseName("ix_project_category_id");
        builder.HasIndex(model => new { model.PublicationStatus, model.ServiceId, model.CategoryId })
            .HasDatabaseName("ix_project_publication_status_service_id_category_id");
    }
}
