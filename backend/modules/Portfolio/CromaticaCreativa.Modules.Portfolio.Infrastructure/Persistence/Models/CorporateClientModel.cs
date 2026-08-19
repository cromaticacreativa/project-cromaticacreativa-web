namespace CromaticaCreativa.Modules.Portfolio.Infrastructure.Persistence.Models;

public sealed class CorporateClientModel
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string LogoReference { get; set; } = string.Empty;

    public string VisibilityStatus { get; set; } = PortfolioPersistenceValues.Hidden;

    public ICollection<ProjectModel> Projects { get; set; } = [];
}
