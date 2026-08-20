import { randomUUID } from 'node:crypto';
import { CompanyProfilePersistenceDto } from '../../../CompanyProfile.Commons/DTOs/CompanyProfilePersistenceDto';
import { CompanyContactInformation } from '../../../CompanyProfile.Domain/Aggregates/CompanyContactInformation';
import { Address } from '../../../CompanyProfile.Domain/ValueObjects/Address';
import { CompanyContactInformationId } from '../../../CompanyProfile.Domain/ValueObjects/CompanyContactInformationId';
import { CompanyLocation } from '../../../CompanyProfile.Domain/ValueObjects/CompanyLocation';
import { EmailAddress } from '../../../CompanyProfile.Domain/ValueObjects/EmailAddress';
import { ExternalUrl } from '../../../CompanyProfile.Domain/ValueObjects/ExternalUrl';
import { GeoCoordinates } from '../../../CompanyProfile.Domain/ValueObjects/GeoCoordinates';
import { PhoneNumber } from '../../../CompanyProfile.Domain/ValueObjects/PhoneNumber';
import { SocialLink } from '../../../CompanyProfile.Domain/ValueObjects/SocialLink';
import { CompanyProfilePersistenceModel } from '../Models/CompanyProfilePersistenceModel';
import { EmailPersistenceModel } from '../Models/EmailPersistenceModel';
import { LocationPersistenceModel } from '../Models/LocationPersistenceModel';
import { PhonePersistenceModel } from '../Models/PhonePersistenceModel';
import { SocialLinkPersistenceModel } from '../Models/SocialLinkPersistenceModel';

export class CompanyProfileMapper {
  public static toDomain(model: CompanyProfilePersistenceDto): CompanyContactInformation {
    const profile = CompanyContactInformation.create(
      new CompanyContactInformationId(model.id),
      new EmailAddress(model.contactRequestRecipientEmail),
    );

    for (const item of this.ordered(model.phones ?? [])) {
      if (!profile.addPhone(new PhoneNumber(item.number))) {
        throw new Error(`El perfil '${model.id}' contiene teléfonos públicos duplicados.`);
      }
    }

    for (const item of this.ordered(model.emails ?? [])) {
      if (!profile.addEmail(new EmailAddress(item.address))) {
        throw new Error(`El perfil '${model.id}' contiene correos públicos duplicados.`);
      }
    }

    for (const item of this.ordered(model.socialLinks ?? [])) {
      if (!profile.addSocialLink(new SocialLink(item.network, new ExternalUrl(item.url)))) {
        throw new Error(`El perfil '${model.id}' contiene más de un enlace para la red '${item.network}'.`);
      }
    }

    if (model.location) {
      profile.setLocation(new CompanyLocation(
        new Address(model.location.address),
        new GeoCoordinates(model.location.latitude, model.location.longitude),
      ));
    }

    return profile;
  }

  public static toPersistence(
    profile: CompanyContactInformation,
    existing: CompanyProfilePersistenceModel | null = null,
  ): CompanyProfilePersistenceModel {
    if (existing && existing.id !== profile.id.value) {
      throw new Error('El estado persistido existente pertenece a otro perfil de empresa.');
    }

    const model = new CompanyProfilePersistenceModel();
    model.id = profile.id.value;
    model.singletonKey = 1;
    model.contactRequestRecipientEmail = profile.contactRequestRecipientEmail.value;
    model.phones = profile.phones.map((phone, displayOrder) => Object.assign(new PhonePersistenceModel(), {
      id: existing?.phones?.find((item) => item.number === phone.value)?.id ?? randomUUID(),
      companyProfileId: profile.id.value,
      number: phone.value,
      displayOrder,
      companyProfile: model,
    }));
    model.emails = profile.emails.map((email, displayOrder) => Object.assign(new EmailPersistenceModel(), {
      id: existing?.emails?.find((item) => item.address === email.value)?.id ?? randomUUID(),
      companyProfileId: profile.id.value,
      address: email.value,
      displayOrder,
      companyProfile: model,
    }));
    model.socialLinks = profile.socialLinks.map((link, displayOrder) => Object.assign(new SocialLinkPersistenceModel(), {
      id: existing?.socialLinks?.find((item) => this.sameNetwork(item.network, link.network))?.id ?? randomUUID(),
      companyProfileId: profile.id.value,
      network: link.network,
      url: link.url.value,
      displayOrder,
      companyProfile: model,
    }));
    model.location = profile.location
      ? Object.assign(new LocationPersistenceModel(), {
        companyProfileId: profile.id.value,
        address: profile.location.address.value,
        latitude: profile.location.coordinates.latitude,
        longitude: profile.location.coordinates.longitude,
        companyProfile: model,
      })
      : null;
    return model;
  }

  private static ordered<T extends { id: string; displayOrder: number }>(items: readonly T[]): T[] {
    if (items.some((item) => !Number.isInteger(item.displayOrder) || item.displayOrder < 0)) {
      throw new Error('El estado persistido contiene un orden de visualización inválido.');
    }
    return [...items].sort((left, right) => left.displayOrder - right.displayOrder || left.id.localeCompare(right.id));
  }

  private static sameNetwork(left: string, right: string): boolean {
    return left.trim().toLocaleLowerCase('en-US') === right.trim().toLocaleLowerCase('en-US');
  }
}
