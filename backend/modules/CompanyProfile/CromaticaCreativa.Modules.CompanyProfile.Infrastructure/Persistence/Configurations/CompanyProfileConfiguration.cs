using CromaticaCreativa.Modules.CompanyProfile.Infrastructure.Persistence.Context;
using CromaticaCreativa.Modules.CompanyProfile.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CromaticaCreativa.Modules.CompanyProfile.Infrastructure.Persistence.Configurations;

internal sealed class CompanyProfileConfiguration : IEntityTypeConfiguration<CompanyProfileModel>
{
    public void Configure(EntityTypeBuilder<CompanyProfileModel> builder)
    {
        builder.ToTable(
            "company_profile",
            CompanyProfileDbContext.Schema,
            table => table.HasCheckConstraint("ck_company_profile_singleton_key", "singleton_key = 1"));

        builder.HasKey(model => model.Id).HasName("pk_company_profile");

        builder.Property(model => model.Id).HasColumnName("id").HasColumnType("uuid").IsRequired();
        builder.Property(model => model.SingletonKey)
            .HasColumnName("singleton_key")
            .HasColumnType("integer")
            .HasDefaultValue(1)
            .IsRequired();

        builder.HasIndex(model => model.SingletonKey)
            .IsUnique()
            .HasDatabaseName("uq_company_profile_singleton_key");
    }
}
