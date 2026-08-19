namespace CromaticaCreativa.Modules.CompanyProfile.Infrastructure.Persistence.Models;

public sealed class PhoneModel
{
    public Guid Id { get; set; }

    public Guid CompanyProfileId { get; set; }

    public string Type { get; set; } = CompanyProfilePersistenceValues.Phone;

    public string Number { get; set; } = string.Empty;

    public CompanyProfileModel CompanyProfile { get; set; } = null!;
}
