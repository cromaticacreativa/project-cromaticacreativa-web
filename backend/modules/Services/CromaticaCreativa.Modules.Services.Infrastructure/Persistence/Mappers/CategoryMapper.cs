using CromaticaCreativa.Modules.Services.Domain.Aggregates;
using CromaticaCreativa.Modules.Services.Domain.Enums;
using CromaticaCreativa.Modules.Services.Domain.ValueObjects;
using CromaticaCreativa.Modules.Services.Infrastructure.Persistence.Models;

namespace CromaticaCreativa.Modules.Services.Infrastructure.Persistence.Mappers;

public static class CategoryMapper
{
    public static ServiceCategory ToDomain(CategoryModel model)
    {
        ArgumentNullException.ThrowIfNull(model);

        var category = ServiceCategory.Create(
            new ServiceCategoryId(model.Id),
            new ServiceId(model.ServiceId),
            new ServiceCategoryName(model.Name),
            model.Description,
            new MediaReference(model.ReferenceImage),
            new DisplayOrder(model.DisplayOrder));

        switch (model.Status)
        {
            case ServicesPersistenceValues.Active:
                category.Activate();
                break;
            case ServicesPersistenceValues.Inactive:
                category.Deactivate();
                break;
            default:
                throw new InvalidOperationException($"Category '{model.Id}' has unsupported status '{model.Status}'.");
        }

        return category;
    }

    public static CategoryModel ToPersistence(ServiceCategory category)
    {
        ArgumentNullException.ThrowIfNull(category);

        return new CategoryModel
        {
            Id = category.Id.Value,
            ServiceId = category.ServiceId.Value,
            Name = category.Name.Value,
            Description = category.Description,
            ReferenceImage = category.ReferenceImage.Value,
            Status = category.Status switch
            {
                ServiceCategoryStatus.Active => ServicesPersistenceValues.Active,
                ServiceCategoryStatus.Inactive => ServicesPersistenceValues.Inactive,
                _ => throw new InvalidOperationException($"Unsupported Domain category status '{category.Status}'.")
            },
            DisplayOrder = category.Order.Value
        };
    }
}
