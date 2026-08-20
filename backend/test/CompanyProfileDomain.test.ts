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

const profileId = new CompanyContactInformationId('11111111-1111-4111-8111-111111111111');

function profile(): CompanyContactInformation {
  return CompanyContactInformation.create(profileId, new EmailAddress('recipient@example.com'));
}

test('phones es una colección readonly con altas, bajas y unicidad por valor', () => {
  const value = profile();
  const first = new PhoneNumber(' 123 ');
  assert.equal(value.addPhone(first), true);
  assert.equal(value.addPhone(new PhoneNumber('123')), false);
  assert.equal(value.addPhone(new PhoneNumber('456')), true);
  assert.deepEqual(value.phones.map((phone) => phone.value), ['123', '456']);
  assert.notEqual(value.phones, value.phones);
  assert.equal(value.removePhone(new PhoneNumber('123')), true);
  assert.equal(value.removePhone(first), false);
  assert.deepEqual(value.phones.map((phone) => phone.value), ['456']);
});

test('emails públicos son una colección independiente del destinatario interno', () => {
  const value = profile();
  const publicAddress = new EmailAddress('public@example.com');
  assert.equal(value.addEmail(publicAddress), true);
  assert.equal(value.addEmail(new EmailAddress('public@example.com')), false);
  assert.equal(value.addEmail(new EmailAddress('other@example.com')), true);
  assert.deepEqual(value.emails.map((email) => email.value), ['public@example.com', 'other@example.com']);
  assert.equal(value.emails.some((email) => email.equals(value.contactRequestRecipientEmail)), false);
  value.changeContactRequestRecipientEmail(new EmailAddress('next@example.com'));
  assert.equal(value.contactRequestRecipientEmail.value, 'next@example.com');
  assert.equal(value.removeEmail(publicAddress), true);
  assert.equal(value.removeEmail(publicAddress), false);
});

test('WhatsApp es un SocialLink y cada network puede aparecer una sola vez', () => {
  const value = profile();
  const messagingLink = new SocialLink(' WhatsApp ', new ExternalUrl('https://wa.me/584121234567'));
  const instagram = new SocialLink('Instagram', new ExternalUrl('https://example.com/instagram'));
  assert.equal(value.addSocialLink(messagingLink), true);
  assert.equal(value.addSocialLink(new SocialLink('whatsapp', new ExternalUrl('https://wa.me/580000000000'))), false);
  assert.equal(value.addSocialLink(instagram), true);
  assert.deepEqual(value.socialLinks.map((link) => link.network), ['WhatsApp', 'Instagram']);
  assert.equal(value.removeSocialLink(new SocialLink('WHATSAPP', new ExternalUrl('https://example.com/other'))), true);
  assert.equal(value.removeSocialLink(messagingLink), false);
});

test('CompanyLocation es Value Object sin ID y setLocation reemplaza su valor', () => {
  const value = profile();
  const first = new CompanyLocation(new Address('A'), new GeoCoordinates(10, -20));
  const equal = new CompanyLocation(new Address('A'), new GeoCoordinates(10, -20));
  assert.ok(first.equals(equal));
  assert.equal('id' in first, false);
  value.setLocation(first);
  assert.ok(value.location?.equals(equal));
  const replacement = new CompanyLocation(new Address('B'), new GeoCoordinates(11, -21));
  value.setLocation(replacement);
  assert.ok(value.location?.equals(replacement));
  value.removeLocation();
  assert.equal(value.location, null);
});

test('Value Objects validan correo, URL y rangos geográficos', () => {
  assert.throws(() => new EmailAddress('bad-address'), /no es válida/);
  assert.throws(() => new GeoCoordinates(Number.NaN, 0), /rangos válidos/);
  assert.throws(() => new GeoCoordinates(Infinity, 0), /rangos válidos/);
  assert.throws(() => new GeoCoordinates(91, 0), /rangos válidos/);
  assert.throws(() => new GeoCoordinates(0, -181), /rangos válidos/);
  assert.throws(() => new ExternalUrl('mailto:test@example.com'), /HTTP o HTTPS/);
  assert.throws(() => new ExternalUrl('/relative'), /HTTP o HTTPS/);
  assert.ok(new EmailAddress('a@example.com').equals(new EmailAddress('a@example.com')));
});
