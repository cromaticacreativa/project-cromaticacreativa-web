namespace CromaticaCreativa.Modules.CompanyProfile.Infrastructure.Persistence.Models;

public sealed class SocialLinkModel
{
    public Guid Id { get; set; }

    public Guid CompanyProfileId { get; set; }

    public string Network { get; set; } = string.Empty;

    public string Url { get; set; } = string.Empty;

    public int DisplayOrder { get; set; }

    public CompanyProfileModel CompanyProfile { get; set; } = null!;
}
