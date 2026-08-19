using CromaticaCreativa.Modules.Portfolio.Domain.Aggregates;
using CromaticaCreativa.Modules.Portfolio.Domain.Enums;
using CromaticaCreativa.Modules.Portfolio.Domain.ValueObjects;
using CromaticaCreativa.Modules.Portfolio.Infrastructure.Persistence.Models;

namespace CromaticaCreativa.Modules.Portfolio.Infrastructure.Persistence.Mappers;

public static class CorporateClientMapper
{
    public static CorporateClient ToDomain(CorporateClientModel model)
    {
        ArgumentNullException.ThrowIfNull(model);

        var client = CorporateClient.Create(
            new CorporateClientId(model.Id),
            new CorporateClientName(model.Name),
            new MediaReference(model.LogoReference));

        switch (model.VisibilityStatus)
        {
            case PortfolioPersistenceValues.Visible:
                client.Show();
                break;
            case PortfolioPersistenceValues.Hidden:
                client.Hide();
                break;
            default:
                throw new InvalidOperationException(
                    $"Corporate client '{model.Id}' has unsupported visibility status '{model.VisibilityStatus}'.");
        }

        return client;
    }

    public static CorporateClientModel ToPersistence(CorporateClient client)
    {
        ArgumentNullException.ThrowIfNull(client);

        return new CorporateClientModel
        {
            Id = client.Id.Value,
            Name = client.Name.Value,
            LogoReference = client.Logo.Value,
            VisibilityStatus = client.Visibility switch
            {
                VisibilityStatus.Visible => PortfolioPersistenceValues.Visible,
                VisibilityStatus.Hidden => PortfolioPersistenceValues.Hidden,
                _ => throw new InvalidOperationException($"Unsupported Domain visibility status '{client.Visibility}'.")
            }
        };
    }
}
