using CromaticaCreativa.Modules.CompanyProfile.Domain.Entities;
using CromaticaCreativa.Modules.CompanyProfile.Domain.ValueObjects;

namespace CromaticaCreativa.Modules.CompanyProfile.Domain.Aggregates;

public sealed class CompanyContactInformation
{
    private readonly List<SocialLink> _socialLinks = [];

    private CompanyContactInformation(
        CompanyContactInformationId id,
        EmailAddress contactRequestRecipientEmail)
    {
        Id = id ?? throw new ArgumentNullException(nameof(id));
        ContactRequestRecipientEmail = contactRequestRecipientEmail
            ?? throw new ArgumentNullException(nameof(contactRequestRecipientEmail));
    }

    public CompanyContactInformationId Id { get; }

    public PhoneNumber? Phone { get; private set; }

    public PhoneNumber? WhatsApp { get; private set; }

    public EmailAddress? PublicEmail { get; private set; }

    public EmailAddress ContactRequestRecipientEmail { get; private set; }

    public IReadOnlyCollection<SocialLink> SocialLinks => _socialLinks.AsReadOnly();

    public CompanyLocation? Location { get; private set; }

    public static CompanyContactInformation Create(
        CompanyContactInformationId id,
        EmailAddress contactRequestRecipientEmail) =>
        new(id, contactRequestRecipientEmail);

    public void ChangePhone(PhoneNumber? phone) => Phone = phone;

    public void ChangeWhatsApp(PhoneNumber? whatsApp) => WhatsApp = whatsApp;

    public void ChangePublicEmail(EmailAddress? publicEmail) => PublicEmail = publicEmail;

    public void ChangeContactRequestRecipientEmail(EmailAddress email) =>
        ContactRequestRecipientEmail = email ?? throw new ArgumentNullException(nameof(email));

    public bool AddSocialLink(SocialLink socialLink)
    {
        ArgumentNullException.ThrowIfNull(socialLink);

        if (_socialLinks.Contains(socialLink))
        {
            return false;
        }

        _socialLinks.Add(socialLink);
        return true;
    }

    public bool RemoveSocialLink(SocialLink socialLink)
    {
        ArgumentNullException.ThrowIfNull(socialLink);
        return _socialLinks.Remove(socialLink);
    }

    public void SetLocation(
        CompanyLocationId locationId,
        Address address,
        GeoCoordinates? coordinates = null)
    {
        ArgumentNullException.ThrowIfNull(locationId);

        if (Location is null)
        {
            Location = new CompanyLocation(locationId, address, coordinates);
            return;
        }

        if (Location.Id != locationId)
        {
            throw new InvalidOperationException("A location with a different identity is already assigned.");
        }

        Location.Change(address, coordinates);
    }

    public void ChangeLocation(Address address, GeoCoordinates? coordinates = null)
    {
        if (Location is null)
        {
            throw new InvalidOperationException("Company location has not been configured.");
        }

        Location.Change(address, coordinates);
    }

    public void RemoveLocation() => Location = null;
}
