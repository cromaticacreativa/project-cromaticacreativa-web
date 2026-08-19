using CromaticaCreativa.Modules.CompanyProfile.Infrastructure.Persistence.Context;
using CromaticaCreativa.Modules.CompanyProfile.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CromaticaCreativa.Modules.CompanyProfile.Infrastructure.Persistence.Configurations;

internal sealed class EmailConfiguration : IEntityTypeConfiguration<EmailModel>
{
    public void Configure(EntityTypeBuilder<EmailModel> builder)
    {
        builder.ToTable(
            "email",
            CompanyProfileDbContext.Schema,
            table =>
            {
                table.HasCheckConstraint(
                    "ck_email_type",
                    "type IN ('PUBLIC', 'CONTACT_REQUEST_RECIPIENT')");
                table.HasCheckConstraint("ck_email_address", "length(btrim(address)) > 0");
            });

        builder.HasKey(model => model.Id).HasName("pk_email");

        builder.Property(model => model.Id).HasColumnName("id").HasColumnType("uuid").IsRequired();
        builder.Property(model => model.CompanyProfileId).HasColumnName("company_profile_id").HasColumnType("uuid").IsRequired();
        builder.Property(model => model.Type).HasColumnName("type").HasColumnType("text").IsRequired();
        builder.Property(model => model.Address).HasColumnName("address").HasColumnType("text").IsRequired();

        builder.HasOne(model => model.CompanyProfile)
            .WithMany(model => model.Emails)
            .HasForeignKey(model => model.CompanyProfileId)
            .OnDelete(DeleteBehavior.Cascade)
            .HasConstraintName("fk_email_company_profile");

        builder.HasIndex(model => new { model.CompanyProfileId, model.Type })
            .IsUnique()
            .HasDatabaseName("uq_email_company_profile_id_type");
    }
}
