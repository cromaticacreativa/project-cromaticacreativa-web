namespace CromaticaCreativa.Modules.Services.Infrastructure.Persistence.Models;

public sealed class ServiceModel
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string ImageReference { get; set; } = string.Empty;

    public string Status { get; set; } = ServicesPersistenceValues.Inactive;

    public int DisplayOrder { get; set; }

    public ICollection<CategoryModel> Categories { get; set; } = [];
}
