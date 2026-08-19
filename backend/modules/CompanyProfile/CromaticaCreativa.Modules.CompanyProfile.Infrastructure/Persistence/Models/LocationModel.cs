namespace CromaticaCreativa.Modules.CompanyProfile.Infrastructure.Persistence.Models;

public sealed class LocationModel
{
    public Guid Id { get; set; }

    public Guid CompanyProfileId { get; set; }

    public string Address { get; set; } = string.Empty;

    public double? Latitude { get; set; }

    public double? Longitude { get; set; }

    public CompanyProfileModel CompanyProfile { get; set; } = null!;
}
