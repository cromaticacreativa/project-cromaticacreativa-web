using CromaticaCreativa.Modules.Portfolio.Domain.Enums;
using CromaticaCreativa.Modules.Portfolio.Domain.ValueObjects;

namespace CromaticaCreativa.Modules.Portfolio.Domain.Entities;

public sealed class ProjectMedia
{
    internal ProjectMedia(
        ProjectMediaId id,
        MediaReference reference,
        MediaType type,
        DisplayOrder order)
    {
        if (!Enum.IsDefined(type))
        {
            throw new ArgumentOutOfRangeException(nameof(type), type, "Unknown media type.");
        }

        Id = id ?? throw new ArgumentNullException(nameof(id));
        Reference = reference ?? throw new ArgumentNullException(nameof(reference));
        Type = type;
        Order = order;
    }

    public ProjectMediaId Id { get; }

    public MediaReference Reference { get; private set; }

    public MediaType Type { get; private set; }

    public DisplayOrder Order { get; private set; }

    internal void ChangeReference(MediaReference reference) =>
        Reference = reference ?? throw new ArgumentNullException(nameof(reference));

    internal void ChangeType(MediaType type)
    {
        if (!Enum.IsDefined(type))
        {
            throw new ArgumentOutOfRangeException(nameof(type), type, "Unknown media type.");
        }

        Type = type;
    }

    internal void ChangeOrder(DisplayOrder order) => Order = order;
}
