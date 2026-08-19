using CromaticaCreativa.Modules.CompanyProfile.Infrastructure.Persistence.Context;
using CromaticaCreativa.Modules.CompanyProfile.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CromaticaCreativa.Modules.CompanyProfile.Infrastructure.Persistence.Configurations;

internal sealed class SocialLinkConfiguration : IEntityTypeConfiguration<SocialLinkModel>
{
    public void Configure(EntityTypeBuilder<SocialLinkModel> builder)
    {
        builder.ToTable(
            "social_link",
            CompanyProfileDbContext.Schema,
            table =>
            {
                table.HasCheckConstraint("ck_social_link_network", "length(btrim(network)) > 0");
                table.HasCheckConstraint("ck_social_link_url", "length(btrim(url)) > 0");
                table.HasCheckConstraint("ck_social_link_display_order", "display_order >= 0");
            });

        builder.HasKey(model => model.Id).HasName("pk_social_link");

        builder.Property(model => model.Id).HasColumnName("id").HasColumnType("uuid").IsRequired();
        builder.Property(model => model.CompanyProfileId).HasColumnName("company_profile_id").HasColumnType("uuid").IsRequired();
        builder.Property(model => model.Network).HasColumnName("network").HasColumnType("text").IsRequired();
        builder.Property(model => model.Url).HasColumnName("url").HasColumnType("text").IsRequired();
        builder.Property(model => model.DisplayOrder).HasColumnName("display_order").HasColumnType("integer").IsRequired();

        builder.HasOne(model => model.CompanyProfile)
            .WithMany(model => model.SocialLinks)
            .HasForeignKey(model => model.CompanyProfileId)
            .OnDelete(DeleteBehavior.Cascade)
            .HasConstraintName("fk_social_link_company_profile");

        builder.HasIndex(model => new { model.CompanyProfileId, model.Network })
            .IsUnique()
            .HasDatabaseName("uq_social_link_company_profile_id_network");
    }
}
