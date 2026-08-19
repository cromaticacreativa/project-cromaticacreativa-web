using CromaticaCreativa.Modules.Services.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;

namespace CromaticaCreativa.Modules.Services.Infrastructure.Persistence.Context;

public sealed class ServicesDbContext(DbContextOptions<ServicesDbContext> options) : DbContext(options)
{
    public const string Schema = "services";
    public const string MigrationsHistoryTable = "__ef_migrations_history";

    public DbSet<ServiceModel> Services => Set<ServiceModel>();

    public DbSet<CategoryModel> Categories => Set<CategoryModel>();

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
                npgsqlOptions.MigrationsAssembly(typeof(ServicesDbContext).Assembly.FullName);
                npgsqlOptions.MigrationsHistoryTable(MigrationsHistoryTable, Schema);
            });
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ServicesDbContext).Assembly);
    }
}
