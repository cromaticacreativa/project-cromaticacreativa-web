using CromaticaCreativa.Modules.CompanyProfile.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace CromaticaCreativa.Modules.CompanyProfile.Infrastructure.Persistence.DesignTime;

public sealed class CompanyProfileDbContextFactory : IDesignTimeDbContextFactory<CompanyProfileDbContext>
{
    private const string ConnectionStringVariable = "CROMATICA_DB_CONNECTION_STRING";

    public CompanyProfileDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable(ConnectionStringVariable);
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                $"Set the {ConnectionStringVariable} environment variable before using CompanyProfile EF Core tooling.");
        }

        var optionsBuilder = new DbContextOptionsBuilder<CompanyProfileDbContext>();
        CompanyProfileDbContext.ConfigureNpgsql(optionsBuilder, connectionString);
        return new CompanyProfileDbContext(optionsBuilder.Options);
    }
}
