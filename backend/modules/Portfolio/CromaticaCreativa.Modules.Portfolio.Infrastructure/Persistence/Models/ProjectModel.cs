namespace CromaticaCreativa.Modules.Portfolio.Infrastructure.Persistence.Models;

public sealed class ProjectModel
{
    public Guid Id { get; set; }

    public string? Title { get; set; }

    public string Description { get; set; } = string.Empty;

    public string PublicationStatus { get; set; } = PortfolioPersistenceValues.Draft;

    public int DisplayOrder { get; set; }

    public Guid? CorporateClientId { get; set; }

    public Guid ServiceId { get; set; }

    public Guid CategoryId { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public CorporateClientModel? CorporateClient { get; set; }

    public ICollection<MediaModel> Media { get; set; } = [];
}
