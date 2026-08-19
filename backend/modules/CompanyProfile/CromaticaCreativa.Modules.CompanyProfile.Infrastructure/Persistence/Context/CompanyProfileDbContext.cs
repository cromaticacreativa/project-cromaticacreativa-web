using CromaticaCreativa.Modules.CompanyProfile.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;

namespace CromaticaCreativa.Modules.CompanyProfile.Infrastructure.Persistence.Context;

public sealed class CompanyProfileDbContext(DbContextOptions<CompanyProfileDbContext> options) : DbContext(options)
{
    public const string Schema = "company_profile";
    public const string MigrationsHistoryTable = "__ef_migrations_history";

    public DbSet<CompanyProfileModel> CompanyProfiles => Set<CompanyProfileModel>();

    public DbSet<PhoneModel> Phones => Set<PhoneModel>();

    public DbSet<EmailModel> Emails => Set<EmailModel>();

    public DbSet<LocationModel> Locations => Set<LocationModel>();

    public DbSet<SocialLinkModel> SocialLinks => Set<SocialLinkModel>();

    public static void ConfigureNpgsql(DbContextOptionsBuilder optionsBuilder, string connectionString)
    {
        ArgumentNullException.ThrowIfNull(optionsBuilder);

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new ArgumentException("The PostgreSQL connection string cannot be empty.", nameof(connectionString));
        }

        optionsBuilder.UseNpgsql(
            connectionString,
            npgsqlOptions =>
            {
                npgsqlOptions.MigrationsAssembly(typeof(CompanyProfileDbContext).Assembly.FullName);
                npgsqlOptions.MigrationsHistoryTable(MigrationsHistoryTable, Schema);
            });
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CompanyProfileDbContext).Assembly);
    }
}
