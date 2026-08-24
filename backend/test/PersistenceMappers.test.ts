import assert from 'node:assert/strict';
import test from 'node:test';
import { CompanyContactInformation } from '../src/modules/CompanyProfile/CompanyProfile.Domain/Aggregates/CompanyContactInformation';
import { Address } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/Address';
import { CompanyContactInformationId } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/CompanyContactInformationId';
import { CompanyLocation } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/CompanyLocation';
import { EmailAddress } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/EmailAddress';
import { ExternalUrl } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/ExternalUrl';
import { GeoCoordinates } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/GeoCoordinates';
import { PhoneNumber } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/PhoneNumber';
import { SocialLink } from '../src/modules/CompanyProfile/CompanyProfile.Domain/ValueObjects/SocialLink';
import { CompanyProfileMapper } from '../src/modules/CompanyProfile/CompanyProfile.Infrastructure/Persistence/Mappers/CompanyProfileMapper';
import { CompanyProfilePersistenceModel } from '../src/modules/CompanyProfile/CompanyProfile.Infrastructure/Persistence/Models/CompanyProfilePersistenceModel';
import { EmailPersistenceModel } from '../src/modules/CompanyProfile/CompanyProfile.Infrastructure/Persistence/Models/EmailPersistenceModel';
import { LocationPersistenceModel } from '../src/modules/CompanyProfile/CompanyProfile.Infrastructure/Persistence/Models/LocationPersistenceModel';
import { PhonePersistenceModel } from '../src/modules/CompanyProfile/CompanyProfile.Infrastructure/Persistence/Models/PhonePersistenceModel';
import { SocialLinkPersistenceModel } from '../src/modules/CompanyProfile/CompanyProfile.Infrastructure/Persistence/Models/SocialLinkPersistenceModel';
import { Project } from '../src/modules/Portfolio/Portfolio.Domain/Aggregates/Project';
import { MediaType } from '../src/modules/Portfolio/Portfolio.Domain/Enums/MediaType';
import { PublicationStatus } from '../src/modules/Portfolio/Portfolio.Domain/Enums/PublicationStatus';
import { VisibilityStatus } from '../src/modules/Portfolio/Portfolio.Domain/Enums/VisibilityStatus';
import { CalendarDate } from '../src/modules/Portfolio/Portfolio.Domain/ValueObjects/CalendarDate';
import { DisplayOrder as PortfolioOrder } from '../src/modules/Portfolio/Portfolio.Domain/ValueObjects/DisplayOrder';
import { MediaReference as PortfolioMedia } from '../src/modules/Portfolio/Portfolio.Domain/ValueObjects/MediaReference';
import { ProjectCategoryReference } from '../src/modules/Portfolio/Portfolio.Domain/ValueObjects/ProjectCategoryReference';
import { ProjectId } from '../src/modules/Portfolio/Portfolio.Domain/ValueObjects/ProjectId';
import { ProjectMediaId } from '../src/modules/Portfolio/Portfolio.Domain/ValueObjects/ProjectMediaId';
import { ProjectPeriod } from '../src/modules/Portfolio/Portfolio.Domain/ValueObjects/ProjectPeriod';
import { ProjectServiceReference } from '../src/modules/Portfolio/Portfolio.Domain/ValueObjects/ProjectServiceReference';
import { ProjectTitle } from '../src/modules/Portfolio/Portfolio.Domain/ValueObjects/ProjectTitle';
import { CorporateClientMapper } from '../src/modules/Portfolio/Portfolio.Infrastructure/Persistence/Mappers/CorporateClientMapper';
import { ProjectMapper } from '../src/modules/Portfolio/Portfolio.Infrastructure/Persistence/Mappers/ProjectMapper';
import { CorporateClientPersistenceModel } from '../src/modules/Portfolio/Portfolio.Infrastructure/Persistence/Models/CorporateClientPersistenceModel';
import { MediaPersistenceModel } from '../src/modules/Portfolio/Portfolio.Infrastructure/Persistence/Models/MediaPersistenceModel';
import { ProjectPersistenceModel } from '../src/modules/Portfolio/Portfolio.Infrastructure/Persistence/Models/ProjectPersistenceModel';
import { ServiceCategoryStatus } from '../src/modules/Services/Services.Domain/Enums/ServiceCategoryStatus';
import { ServiceStatus } from '../src/modules/Services/Services.Domain/Enums/ServiceStatus';
import { ServiceCategoryMapper } from '../src/modules/Services/Services.Infrastructure/Persistence/Mappers/ServiceCategoryMapper';
import { ServiceMapper } from '../src/modules/Services/Services.Infrastructure/Persistence/Mappers/ServiceMapper';
import { ServiceCategoryPersistenceModel } from '../src/modules/Services/Services.Infrastructure/Persistence/Models/ServiceCategoryPersistenceModel';
import { ServicePersistenceModel } from '../src/modules/Services/Services.Infrastructure/Persistence/Models/ServicePersistenceModel';

const uuid = (n: number) => `${n.toString().padStart(8, '0')}-1111-4111-8111-${n.toString().padStart(12, '0')}`;

test('ProjectMapper restaura publicación, orden de media y portada', () => {
  const project = Project.create({
    id: new ProjectId(uuid(1)),
    description: 'd',
    service: new ProjectServiceReference(uuid(2)),
    category: new ProjectCategoryReference(uuid(3)),
    period: new ProjectPeriod(new CalendarDate('2024-01-01'), new CalendarDate('2024-01-03')),
    order: new PortfolioOrder(1),
    title: new ProjectTitle('Título'),
  });
  project.addMedia(new ProjectMediaId(uuid(5)), new PortfolioMedia('second'), MediaType.Video, new PortfolioOrder(2));
  project.addMedia(new ProjectMediaId(uuid(4)), new PortfolioMedia('first'), MediaType.Image, new PortfolioOrder(1));
  project.setCoverMedia(new ProjectMediaId(uuid(4)));
  project.publish();
  const restored = ProjectMapper.toDomain(ProjectMapper.toPersistence(project));
  assert.equal(restored.status, PublicationStatus.Published);
  assert.equal(restored.media[0]?.reference.value, 'first');
  assert.equal(restored.coverMediaId?.value, uuid(4));
  assert.equal(restored.period.totalDays, 2);
});

test('ProjectMapper detecta estado persistido inválido', () => {
  const model = Object.assign(new ProjectPersistenceModel(), {
    id: uuid(1), title: null, description: '', publicationStatus: PublicationStatus.Draft,
    displayOrder: 0, corporateClientId: null, serviceId: uuid(2), categoryId: uuid(3),
    startDate: '2024-01-01', endDate: '2024-01-01',
  });
  model.media = [4, 5].map((n) => Object.assign(new MediaPersistenceModel(), {
    id: uuid(n), projectId: uuid(1), reference: `r${n}`, type: MediaType.Image, displayOrder: n, isCover: true,
  }));
  assert.throws(() => ProjectMapper.toDomain(model), /más de un medio/);
  model.media = [];
  model.publicationStatus = 'UNKNOWN' as PublicationStatus;
  assert.throws(() => ProjectMapper.toDomain(model), /estado no soportado/);
});

test('Mappers de CorporateClient, Service y ServiceCategory preservan estado y ownership', () => {
  const client = CorporateClientMapper.toDomain(Object.assign(new CorporateClientPersistenceModel(), {
    id: uuid(1), name: 'Client', logoReference: 'logo', visibilityStatus: VisibilityStatus.Visible,
  }));
  assert.equal(client.visibility, VisibilityStatus.Visible);
  const service = ServiceMapper.toDomain(Object.assign(new ServicePersistenceModel(), {
    id: uuid(2), name: 'Service', description: '', imageReference: 'image', status: ServiceStatus.Active, displayOrder: 0,
  }));
  assert.equal(service.status, ServiceStatus.Active);
  const category = ServiceCategoryMapper.toDomain(Object.assign(new ServiceCategoryPersistenceModel(), {
    id: uuid(3), serviceId: uuid(2), name: 'Category', description: '', referenceImage: 'image',
    status: ServiceCategoryStatus.Active, displayOrder: 0,
  }));
  assert.equal(category.status, ServiceCategoryStatus.Active);
  assert.equal(category.serviceId.value, uuid(2));
});

function profileModel(): CompanyProfilePersistenceModel {
  return Object.assign(new CompanyProfilePersistenceModel(), {
    id: uuid(1),
    singletonKey: 1,
    contactRequestRecipientEmail: 'recipient@example.com',
    phones: [
      Object.assign(new PhonePersistenceModel(), {
        id: uuid(2), companyProfileId: uuid(1), number: '123', displayOrder: 1,
      }),
      Object.assign(new PhonePersistenceModel(), {
        id: uuid(3), companyProfileId: uuid(1), number: '456', displayOrder: 0,
      }),
    ],
    emails: [
      Object.assign(new EmailPersistenceModel(), {
        id: uuid(4), companyProfileId: uuid(1), address: 'first@example.com', displayOrder: 1,
      }),
      Object.assign(new EmailPersistenceModel(), {
        id: uuid(5), companyProfileId: uuid(1), address: 'second@example.com', displayOrder: 0,
      }),
    ],
    location: Object.assign(new LocationPersistenceModel(), {
      companyProfileId: uuid(1), address: 'Dirección inicial', latitude: 10, longitude: -20,
    }),
    socialLinks: [Object.assign(new SocialLinkPersistenceModel(), {
      id: uuid(6), companyProfileId: uuid(1), network: 'WhatsApp',
      url: 'https://wa.me/584121234567', displayOrder: 0,
    })],
  });
}

test('CompanyProfileMapper restaura colecciones ordenadas, recipient, WhatsApp y location', () => {
  const profile = CompanyProfileMapper.toDomain(profileModel());
  assert.deepEqual(profile.phones.map((phone) => phone.value), ['456', '123']);
  assert.deepEqual(profile.emails.map((email) => email.value), ['second@example.com', 'first@example.com']);
  assert.equal(profile.contactRequestRecipientEmail.value, 'recipient@example.com');
  assert.equal(profile.socialLinks[0]?.network, 'WhatsApp');
  assert.equal(profile.location?.address.value, 'Dirección inicial');
  assert.equal(profile.location?.coordinates.longitude, -20);
  assert.equal('id' in profile.location!, false);
});

test('CompanyProfileMapper rechaza recipient y colecciones persistidas inválidas', () => {
  const invalidRecipient = profileModel();
  invalidRecipient.contactRequestRecipientEmail = '';
  assert.throws(() => CompanyProfileMapper.toDomain(invalidRecipient), /correo electrónico no puede estar vacío/);

  const duplicatePhone = profileModel();
  duplicatePhone.phones.push(Object.assign(new PhonePersistenceModel(), {
    id: uuid(7), companyProfileId: uuid(1), number: '123', displayOrder: 2,
  }));
  assert.throws(() => CompanyProfileMapper.toDomain(duplicatePhone), /teléfonos públicos duplicados/);

  const duplicateEmail = profileModel();
  duplicateEmail.emails.push(Object.assign(new EmailPersistenceModel(), {
    id: uuid(8), companyProfileId: uuid(1), address: 'first@example.com', displayOrder: 2,
  }));
  assert.throws(() => CompanyProfileMapper.toDomain(duplicateEmail), /correos públicos duplicados/);

  const networks = profileModel();
  networks.socialLinks.push(Object.assign(new SocialLinkPersistenceModel(), {
    id: uuid(9), companyProfileId: uuid(1), network: 'whatsapp',
    url: 'https://wa.me/580000000000', displayOrder: 1,
  }));
  assert.throws(() => CompanyProfileMapper.toDomain(networks), /más de un enlace/);

  const invalidLocation = profileModel();
  invalidLocation.location = Object.assign(new LocationPersistenceModel(), {
    companyProfileId: uuid(1), address: 'Dirección inválida por latitud', latitude: 91, longitude: 0,
  });
  assert.throws(() => CompanyProfileMapper.toDomain(invalidLocation), /latitud debe estar entre/);

  const invalidOrder = profileModel();
  invalidOrder.phones[0]!.displayOrder = -1;
  assert.throws(() => CompanyProfileMapper.toDomain(invalidOrder), /orden de visualización inválido/);
});

test('CompanyProfileMapper persiste colecciones y conserva IDs técnicos por valor lógico', () => {
  const existing = profileModel();
  const profile = CompanyContactInformation.create(new CompanyContactInformationId(uuid(1)),
    new EmailAddress('new-recipient@example.com'));
  profile.addPhone(new PhoneNumber('123'));
  profile.addPhone(new PhoneNumber('999'));
  profile.addEmail(new EmailAddress('first@example.com'));
  profile.addEmail(new EmailAddress('new@example.com'));
  profile.addSocialLink(new SocialLink('whatsapp', new ExternalUrl('https://wa.me/new')));
  profile.addSocialLink(new SocialLink('Instagram', new ExternalUrl('https://example.com/instagram')));
  profile.setLocation(new CompanyLocation(new Address('Dirección actualizada'), new GeoCoordinates(11, -21)));

  const mapped = CompanyProfileMapper.toPersistence(profile, existing);
  assert.equal(mapped.phones[0]?.id, uuid(2));
  assert.notEqual(mapped.phones[1]?.id, uuid(2));
  assert.equal(mapped.emails[0]?.id, uuid(4));
  assert.notEqual(mapped.emails[1]?.id, uuid(4));
  assert.equal(mapped.socialLinks[0]?.id, uuid(6));
  assert.equal(mapped.contactRequestRecipientEmail, 'new-recipient@example.com');
  assert.deepEqual(mapped.phones.map((phone) => phone.displayOrder), [0, 1]);
  assert.deepEqual(mapped.emails.map((email) => email.displayOrder), [0, 1]);
  assert.equal(mapped.location?.companyProfileId, uuid(1));
  assert.equal('id' in mapped.location!, false);
});
