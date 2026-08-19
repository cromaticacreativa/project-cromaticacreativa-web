using CromaticaCreativa.Modules.Portfolio.Infrastructure.Persistence.Context;
using CromaticaCreativa.Modules.Portfolio.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CromaticaCreativa.Modules.Portfolio.Infrastructure.Persistence.Configurations;

internal sealed class MediaConfiguration : IEntityTypeConfiguration<MediaModel>
{
    public void Configure(EntityTypeBuilder<MediaModel> builder)
    {
        builder.ToTable(
            "media",
            PortfolioDbContext.Schema,
            table =>
            {
                table.HasCheckConstraint("ck_media_reference", "length(btrim(reference)) > 0");
                table.HasCheckConstraint("ck_media_type", "type IN ('IMAGE', 'VIDEO')");
                table.HasCheckConstraint("ck_media_display_order", "display_order >= 0");
            });

        builder.HasKey(model => model.Id).HasName("pk_media");

        builder.Property(model => model.Id).HasColumnName("id").HasColumnType("uuid").IsRequired();
        builder.Property(model => model.ProjectId).HasColumnName("project_id").HasColumnType("uuid").IsRequired();
        builder.Property(model => model.Reference).HasColumnName("reference").HasColumnType("text").IsRequired();
        builder.Property(model => model.Type).HasColumnName("type").HasColumnType("text").IsRequired();
        builder.Property(model => model.DisplayOrder).HasColumnName("display_order").HasColumnType("integer").IsRequired();
        builder.Property(model => model.IsCover).HasColumnName("is_cover").HasColumnType("boolean").HasDefaultValue(false).IsRequired();

        builder.HasOne(model => model.Project)
            .WithMany(model => model.Media)
            .HasForeignKey(model => model.ProjectId)
            .OnDelete(DeleteBehavior.Cascade)
            .HasConstraintName("fk_media_project");

        builder.HasIndex(model => model.ProjectId, "ix_media_project_id");
        builder.HasIndex(model => model.ProjectId, "uq_media_project_cover")
            .IsUnique()
            .HasFilter("is_cover = true");
    }
}
