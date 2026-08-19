using CromaticaCreativa.Modules.CompanyProfile.Infrastructure.Persistence.Context;
using CromaticaCreativa.Modules.CompanyProfile.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CromaticaCreativa.Modules.CompanyProfile.Infrastructure.Persistence.Configurations;

internal sealed class PhoneConfiguration : IEntityTypeConfiguration<PhoneModel>
{
    public void Configure(EntityTypeBuilder<PhoneModel> builder)
    {
        builder.ToTable(
            "phone",
            CompanyProfileDbContext.Schema,
            table =>
            {
                table.HasCheckConstraint("ck_phone_type", "type IN ('PHONE', 'WHATSAPP')");
                table.HasCheckConstraint("ck_phone_number", "length(btrim(number)) > 0");
            });

        builder.HasKey(model => model.Id).HasName("pk_phone");

        builder.Property(model => model.Id).HasColumnName("id").HasColumnType("uuid").IsRequired();
        builder.Property(model => model.CompanyProfileId).HasColumnName("company_profile_id").HasColumnType("uuid").IsRequired();
        builder.Property(model => model.Type).HasColumnName("type").HasColumnType("text").IsRequired();
        builder.Property(model => model.Number).HasColumnName("number").HasColumnType("text").IsRequired();

        builder.HasOne(model => model.CompanyProfile)
            .WithMany(model => model.Phones)
            .HasForeignKey(model => model.CompanyProfileId)
            .OnDelete(DeleteBehavior.Cascade)
            .HasConstraintName("fk_phone_company_profile");

        builder.HasIndex(model => new { model.CompanyProfileId, model.Type })
            .IsUnique()
            .HasDatabaseName("uq_phone_company_profile_id_type");
    }
}
