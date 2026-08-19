using CromaticaCreativa.Modules.Portfolio.Infrastructure.Persistence.Models;
using Microsoft.EntityFrameworkCore;

namespace CromaticaCreativa.Modules.Portfolio.Infrastructure.Persistence.Context;

public sealed class PortfolioDbContext(DbContextOptions<PortfolioDbContext> options) : DbContext(options)
{
    public const string Schema = "portfolio";
    public const string MigrationsHistoryTable = "__ef_migrations_history";

    public DbSet<ProjectModel> Projects => Set<ProjectModel>();

    public DbSet<MediaModel> Media => Set<MediaModel>();

    public DbSet<CorporateClientModel> CorporateClients => Set<CorporateClientModel>();

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
                npgsqlOptions.MigrationsAssembly(typeof(PortfolioDbContext).Assembly.FullName);
                npgsqlOptions.MigrationsHistoryTable(MigrationsHistoryTable, Schema);
            });
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(Schema);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(PortfolioDbContext).Assembly);
    }
}
