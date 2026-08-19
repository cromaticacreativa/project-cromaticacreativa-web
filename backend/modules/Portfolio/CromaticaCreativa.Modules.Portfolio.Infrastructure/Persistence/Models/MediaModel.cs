namespace CromaticaCreativa.Modules.Portfolio.Infrastructure.Persistence.Models;

public sealed class MediaModel
{
    public Guid Id { get; set; }

    public Guid ProjectId { get; set; }

    public string Reference { get; set; } = string.Empty;

    public string Type { get; set; } = PortfolioPersistenceValues.Image;

    public int DisplayOrder { get; set; }

    public bool IsCover { get; set; }

    public ProjectModel Project { get; set; } = null!;
}
