namespace CromaticaCreativa.Modules.CompanyProfile.Infrastructure.Persistence.Models;

public sealed class CompanyProfileModel
{
    public Guid Id { get; set; }

    public int SingletonKey { get; set; } = 1;

    public ICollection<PhoneModel> Phones { get; set; } = [];

    public ICollection<EmailModel> Emails { get; set; } = [];

    public LocationModel? Location { get; set; }

    public ICollection<SocialLinkModel> SocialLinks { get; set; } = [];
}
