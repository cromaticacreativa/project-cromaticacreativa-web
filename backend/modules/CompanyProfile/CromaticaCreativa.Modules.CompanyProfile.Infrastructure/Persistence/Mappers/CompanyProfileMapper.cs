using CromaticaCreativa.Modules.CompanyProfile.Domain.Aggregates;
using CromaticaCreativa.Modules.CompanyProfile.Domain.ValueObjects;
using CromaticaCreativa.Modules.CompanyProfile.Infrastructure.Persistence.Models;

namespace CromaticaCreativa.Modules.CompanyProfile.Infrastructure.Persistence.Mappers;

public static class CompanyProfileMapper
{
    public static CompanyContactInformation ToDomain(CompanyProfileModel model)
    {
        ArgumentNullException.ThrowIfNull(model);

        ValidateEmailTypes(model);
        var recipients = model.Emails
            .Where(email => email.Type == CompanyProfilePersistenceValues.ContactRequestRecipient)
            .ToArray();

        if (recipients.Length != 1)
        {
            throw new InvalidOperationException(
                $"Company profile '{model.Id}' must contain exactly one contact-request recipient email row.");
        }

        var profile = CompanyContactInformation.Create(
            new CompanyContactInformationId(model.Id),
            new EmailAddress(recipients[0].Address));

        var seenPhoneTypes = new HashSet<string>(StringComparer.Ordinal);
        foreach (var phone in model.Phones)
        {
            if (!seenPhoneTypes.Add(phone.Type))
            {
                throw new InvalidOperationException(
                    $"Company profile '{model.Id}' contains more than one '{phone.Type}' phone row.");
            }

            switch (phone.Type)
            {
                case CompanyProfilePersistenceValues.Phone:
                    profile.ChangePhone(new PhoneNumber(phone.Number));
                    break;
                case CompanyProfilePersistenceValues.WhatsApp:
                    profile.ChangeWhatsApp(new PhoneNumber(phone.Number));
                    break;
                default:
                    throw new InvalidOperationException(
                        $"Company profile '{model.Id}' has unsupported phone type '{phone.Type}'.");
            }
        }

        var publicEmails = model.Emails
            .Where(email => email.Type == CompanyProfilePersistenceValues.PublicEmail)
            .ToArray();
        if (publicEmails.Length > 1)
        {
            throw new InvalidOperationException(
                $"Company profile '{model.Id}' contains more than one public email row.");
        }

        if (publicEmails.Length == 1)
        {
            profile.ChangePublicEmail(new EmailAddress(publicEmails[0].Address));
        }

        if (model.Location is not null)
        {
            GeoCoordinates? coordinates = model.Location.Latitude is null
                ? null
                : new GeoCoordinates(model.Location.Latitude.Value, model.Location.Longitude
                    ?? throw new InvalidOperationException(
                        $"Location '{model.Location.Id}' has latitude without longitude."));

            if (model.Location.Latitude is null && model.Location.Longitude is not null)
            {
                throw new InvalidOperationException(
                    $"Location '{model.Location.Id}' has longitude without latitude.");
            }

            profile.SetLocation(
                new CompanyLocationId(model.Location.Id),
                new Address(model.Location.Address),
                coordinates);
        }

        var seenNetworks = new HashSet<string>(StringComparer.Ordinal);
        foreach (var socialLink in model.SocialLinks.OrderBy(link => link.DisplayOrder).ThenBy(link => link.Id))
        {
            if (!seenNetworks.Add(socialLink.Network))
            {
                throw new InvalidOperationException(
                    $"Company profile '{model.Id}' contains more than one social link for '{socialLink.Network}'.");
            }

            var added = profile.AddSocialLink(new SocialLink(
                socialLink.Network,
                new ExternalUrl(socialLink.Url)));

            if (!added)
            {
                throw new InvalidOperationException(
                    $"Company profile '{model.Id}' contains duplicate social link data for '{socialLink.Network}'.");
            }
        }

        return profile;
    }

    public static CompanyProfileModel ToPersistence(
        CompanyContactInformation profile,
        CompanyProfileModel? existingModel = null)
    {
        ArgumentNullException.ThrowIfNull(profile);

        if (existingModel is not null && existingModel.Id != profile.Id.Value)
        {
            throw new ArgumentException(
                "The existing persistence model belongs to a different company profile.",
                nameof(existingModel));
        }

        var model = new CompanyProfileModel
        {
            Id = profile.Id.Value,
            SingletonKey = 1
        };

        if (profile.Phone is not null)
        {
            model.Phones.Add(CreatePhoneModel(
                profile.Id.Value,
                CompanyProfilePersistenceValues.Phone,
                profile.Phone.Value,
                existingModel));
        }

        if (profile.WhatsApp is not null)
        {
            model.Phones.Add(CreatePhoneModel(
                profile.Id.Value,
                CompanyProfilePersistenceValues.WhatsApp,
                profile.WhatsApp.Value,
                existingModel));
        }

        if (profile.PublicEmail is not null)
        {
            model.Emails.Add(CreateEmailModel(
                profile.Id.Value,
                CompanyProfilePersistenceValues.PublicEmail,
                profile.PublicEmail.Value,
                existingModel));
        }

        model.Emails.Add(CreateEmailModel(
            profile.Id.Value,
            CompanyProfilePersistenceValues.ContactRequestRecipient,
            profile.ContactRequestRecipientEmail.Value,
            existingModel));

        if (profile.Location is not null)
        {
            model.Location = new LocationModel
            {
                Id = profile.Location.Id.Value,
                CompanyProfileId = profile.Id.Value,
                Address = profile.Location.Address.Value,
                Latitude = profile.Location.Coordinates?.Latitude,
                Longitude = profile.Location.Coordinates?.Longitude
            };
        }

        var displayOrder = 0;
        foreach (var socialLink in profile.SocialLinks)
        {
            var existingLink = existingModel?.SocialLinks.SingleOrDefault(
                item => string.Equals(item.Network, socialLink.Network, StringComparison.Ordinal));

            model.SocialLinks.Add(new SocialLinkModel
            {
                Id = existingLink?.Id ?? Guid.NewGuid(),
                CompanyProfileId = profile.Id.Value,
                Network = socialLink.Network,
                Url = socialLink.Url.Value,
                DisplayOrder = displayOrder++
            });
        }

        return model;
    }

    private static void ValidateEmailTypes(CompanyProfileModel model)
    {
        foreach (var email in model.Emails)
        {
            if (email.Type is not CompanyProfilePersistenceValues.PublicEmail
                and not CompanyProfilePersistenceValues.ContactRequestRecipient)
            {
                throw new InvalidOperationException(
                    $"Company profile '{model.Id}' has unsupported email type '{email.Type}'.");
            }
        }
    }

    private static PhoneModel CreatePhoneModel(
        Guid companyProfileId,
        string type,
        string number,
        CompanyProfileModel? existingModel)
    {
        var existingPhone = existingModel?.Phones.SingleOrDefault(item => item.Type == type);
        return new PhoneModel
        {
            Id = existingPhone?.Id ?? Guid.NewGuid(),
            CompanyProfileId = companyProfileId,
            Type = type,
            Number = number
        };
    }

    private static EmailModel CreateEmailModel(
        Guid companyProfileId,
        string type,
        string address,
        CompanyProfileModel? existingModel)
    {
        var existingEmail = existingModel?.Emails.SingleOrDefault(item => item.Type == type);
        return new EmailModel
        {
            Id = existingEmail?.Id ?? Guid.NewGuid(),
            CompanyProfileId = companyProfileId,
            Type = type,
            Address = address
        };
    }
}
