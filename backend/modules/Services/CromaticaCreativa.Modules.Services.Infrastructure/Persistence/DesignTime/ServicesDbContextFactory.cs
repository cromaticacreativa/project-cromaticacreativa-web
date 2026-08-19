using CromaticaCreativa.Modules.Services.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace CromaticaCreativa.Modules.Services.Infrastructure.Persistence.DesignTime;

public sealed class ServicesDbContextFactory : IDesignTimeDbContextFactory<ServicesDbContext>
{
    private const string ConnectionStringVariable = "CROMATICA_DB_CONNECTION_STRING";

    public ServicesDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable(ConnectionStringVariable);
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                $"Set the {ConnectionStringVariable} environment variable before using Services EF Core tooling.");
        }

        var optionsBuilder = new DbContextOptionsBuilder<ServicesDbContext>();
        ServicesDbContext.ConfigureNpgsql(optionsBuilder, connectionString);
        return new ServicesDbContext(optionsBuilder.Options);
    }
}
