using CromaticaCreativa.Modules.CompanyProfile.Infrastructure.Persistence.Context;
using CromaticaCreativa.Modules.CompanyProfile.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CromaticaCreativa.Modules.CompanyProfile.Infrastructure.Persistence.Configurations;

internal sealed class LocationConfiguration : IEntityTypeConfiguration<LocationModel>
{
    public void Configure(EntityTypeBuilder<LocationModel> builder)
    {
        builder.ToTable(
            "location",
            CompanyProfileDbContext.Schema,
            table =>
            {
                table.HasCheckConstraint("ck_location_address", "length(btrim(address)) > 0");
                table.HasCheckConstraint(
                    "ck_location_coordinates_pair",
                    "(latitude IS NULL AND longitude IS NULL) OR (latitude IS NOT NULL AND longitude IS NOT NULL)");
                table.HasCheckConstraint(
                    "ck_location_latitude",
                    "latitude IS NULL OR latitude BETWEEN -90 AND 90");
                table.HasCheckConstraint(
                    "ck_location_longitude",
                    "longitude IS NULL OR longitude BETWEEN -180 AND 180");
            });

        builder.HasKey(model => model.Id).HasName("pk_location");

        builder.Property(model => model.Id).HasColumnName("id").HasColumnType("uuid").IsRequired();
        builder.Property(model => model.CompanyProfileId).HasColumnName("company_profile_id").HasColumnType("uuid").IsRequired();
        builder.Property(model => model.Address).HasColumnName("address").HasColumnType("text").IsRequired();
        builder.Property(model => model.Latitude).HasColumnName("latitude").HasColumnType("double precision");
        builder.Property(model => model.Longitude).HasColumnName("longitude").HasColumnType("double precision");

        builder.HasOne(model => model.CompanyProfile)
            .WithOne(model => model.Location)
            .HasForeignKey<LocationModel>(model => model.CompanyProfileId)
            .OnDelete(DeleteBehavior.Cascade)
            .HasConstraintName("fk_location_company_profile");

        builder.HasIndex(model => model.CompanyProfileId)
            .IsUnique()
            .HasDatabaseName("uq_location_company_profile_id");
    }
}
