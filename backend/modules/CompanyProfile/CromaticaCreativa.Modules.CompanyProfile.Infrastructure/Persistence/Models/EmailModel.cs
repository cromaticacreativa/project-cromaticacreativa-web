namespace CromaticaCreativa.Modules.CompanyProfile.Infrastructure.Persistence.Models;

public sealed class EmailModel
{
    public Guid Id { get; set; }

    public Guid CompanyProfileId { get; set; }

    public string Type { get; set; } = CompanyProfilePersistenceValues.PublicEmail;

    public string Address { get; set; } = string.Empty;

    public CompanyProfileModel CompanyProfile { get; set; } = null!;
}
