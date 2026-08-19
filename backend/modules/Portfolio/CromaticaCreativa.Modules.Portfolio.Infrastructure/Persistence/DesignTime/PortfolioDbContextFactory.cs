using CromaticaCreativa.Modules.Portfolio.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace CromaticaCreativa.Modules.Portfolio.Infrastructure.Persistence.DesignTime;

public sealed class PortfolioDbContextFactory : IDesignTimeDbContextFactory<PortfolioDbContext>
{
    private const string ConnectionStringVariable = "CROMATICA_DB_CONNECTION_STRING";

    public PortfolioDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable(ConnectionStringVariable);
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                $"Set the {ConnectionStringVariable} environment variable before using Portfolio EF Core tooling.");
        }

        var optionsBuilder = new DbContextOptionsBuilder<PortfolioDbContext>();
        PortfolioDbContext.ConfigureNpgsql(optionsBuilder, connectionString);
        return new PortfolioDbContext(optionsBuilder.Options);
    }
}
