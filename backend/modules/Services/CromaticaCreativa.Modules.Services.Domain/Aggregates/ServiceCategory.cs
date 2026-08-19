using CromaticaCreativa.Modules.Services.Domain.Enums;
using CromaticaCreativa.Modules.Services.Domain.ValueObjects;

namespace CromaticaCreativa.Modules.Services.Domain.Aggregates;

public sealed class ServiceCategory
{
    private ServiceCategory(
        ServiceCategoryId id,
        ServiceId serviceId,
        ServiceCategoryName name,
        string? description,
        MediaReference referenceImage,
        DisplayOrder order)
    {
        Id = id ?? throw new ArgumentNullException(nameof(id));
        ServiceId = serviceId ?? throw new ArgumentNullException(nameof(serviceId));
        Name = name ?? throw new ArgumentNullException(nameof(name));
        Description = description ?? string.Empty;
        ReferenceImage = referenceImage ?? throw new ArgumentNullException(nameof(referenceImage));
        Order = order;
        Status = ServiceCategoryStatus.Inactive;
    }

    public ServiceCategoryId Id { get; }

    public ServiceId ServiceId { get; }

    public ServiceCategoryName Name { get; private set; }

    public string Description { get; private set; }

    public MediaReference ReferenceImage { get; private set; }

    public ServiceCategoryStatus Status { get; private set; }

    public DisplayOrder Order { get; private set; }

    public static ServiceCategory Create(
        ServiceCategoryId id,
        ServiceId serviceId,
        ServiceCategoryName name,
        string? description,
        MediaReference referenceImage,
        DisplayOrder order) =>
        new(id, serviceId, name, description, referenceImage, order);

    public void Rename(ServiceCategoryName name) =>
        Name = name ?? throw new ArgumentNullException(nameof(name));

    public void ChangeDescription(string? description) => Description = description ?? string.Empty;

    public void ChangeReferenceImage(MediaReference referenceImage) =>
        ReferenceImage = referenceImage ?? throw new ArgumentNullException(nameof(referenceImage));

    public void ChangeOrder(DisplayOrder order) => Order = order;

    public void Activate() => Status = ServiceCategoryStatus.Active;

    public void Deactivate() => Status = ServiceCategoryStatus.Inactive;
}
