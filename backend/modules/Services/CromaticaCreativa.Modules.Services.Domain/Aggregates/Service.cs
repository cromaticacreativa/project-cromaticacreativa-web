using CromaticaCreativa.Modules.Services.Domain.Enums;
using CromaticaCreativa.Modules.Services.Domain.ValueObjects;

namespace CromaticaCreativa.Modules.Services.Domain.Aggregates;

public sealed class Service
{
    private Service(
        ServiceId id,
        ServiceName name,
        string? description,
        MediaReference image,
        DisplayOrder order)
    {
        Id = id ?? throw new ArgumentNullException(nameof(id));
        Name = name ?? throw new ArgumentNullException(nameof(name));
        Description = description ?? string.Empty;
        Image = image ?? throw new ArgumentNullException(nameof(image));
        Order = order;
        Status = ServiceStatus.Inactive;
    }

    public ServiceId Id { get; }

    public ServiceName Name { get; private set; }

    public string Description { get; private set; }

    public MediaReference Image { get; private set; }

    public ServiceStatus Status { get; private set; }

    public DisplayOrder Order { get; private set; }

    public static Service Create(
        ServiceId id,
        ServiceName name,
        string? description,
        MediaReference image,
        DisplayOrder order) =>
        new(id, name, description, image, order);

    public void Rename(ServiceName name) =>
        Name = name ?? throw new ArgumentNullException(nameof(name));

    public void ChangeDescription(string? description) => Description = description ?? string.Empty;

    public void ChangeImage(MediaReference image) =>
        Image = image ?? throw new ArgumentNullException(nameof(image));

    public void ChangeOrder(DisplayOrder order) => Order = order;

    public void Activate() => Status = ServiceStatus.Active;

    public void Deactivate() => Status = ServiceStatus.Inactive;
}
