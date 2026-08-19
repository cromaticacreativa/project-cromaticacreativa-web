namespace CromaticaCreativa.Modules.Services.Infrastructure.Persistence.Models;

public sealed class CategoryModel
{
    public Guid Id { get; set; }

    public Guid ServiceId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string ReferenceImage { get; set; } = string.Empty;

    public string Status { get; set; } = ServicesPersistenceValues.Inactive;

    public int DisplayOrder { get; set; }

    public ServiceModel Service { get; set; } = null!;
}
