using CromaticaCreativa.Modules.Services.Domain.Aggregates;
using CromaticaCreativa.Modules.Services.Domain.Enums;
using CromaticaCreativa.Modules.Services.Domain.ValueObjects;
using CromaticaCreativa.Modules.Services.Infrastructure.Persistence.Models;

namespace CromaticaCreativa.Modules.Services.Infrastructure.Persistence.Mappers;

public static class ServiceMapper
{
    public static Service ToDomain(ServiceModel model)
    {
        ArgumentNullException.ThrowIfNull(model);

        var service = Service.Create(
            new ServiceId(model.Id),
            new ServiceName(model.Name),
            model.Description,
            new MediaReference(model.ImageReference),
            new DisplayOrder(model.DisplayOrder));

        switch (model.Status)
        {
            case ServicesPersistenceValues.Active:
                service.Activate();
                break;
            case ServicesPersistenceValues.Inactive:
                service.Deactivate();
                break;
            default:
                throw new InvalidOperationException($"Service '{model.Id}' has unsupported status '{model.Status}'.");
        }

        return service;
    }

    public static ServiceModel ToPersistence(Service service)
    {
        ArgumentNullException.ThrowIfNull(service);

        return new ServiceModel
        {
            Id = service.Id.Value,
            Name = service.Name.Value,
            Description = service.Description,
            ImageReference = service.Image.Value,
            Status = service.Status switch
            {
                ServiceStatus.Active => ServicesPersistenceValues.Active,
                ServiceStatus.Inactive => ServicesPersistenceValues.Inactive,
                _ => throw new InvalidOperationException($"Unsupported Domain service status '{service.Status}'.")
            },
            DisplayOrder = service.Order.Value
        };
    }
}
