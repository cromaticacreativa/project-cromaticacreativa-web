import assert from 'node:assert/strict';
import test from 'node:test';
import { ContactRequest } from '../src/modules/Contact/Contact.Domain/Aggregates/ContactRequest';
import { Client } from '../src/modules/Contact/Contact.Domain/Entities/Client';
import { TipoSolicitud } from '../src/modules/Contact/Contact.Domain/Enums/TipoSolicitud';
import { ContactRequestId } from '../src/modules/Contact/Contact.Domain/ValueObjects/ContactRequestId';
import { ClientId } from '../src/modules/Contact/Contact.Domain/ValueObjects/ClientId';
import { EmailAddress } from '../src/modules/Contact/Contact.Domain/ValueObjects/EmailAddress';
import { PersonName } from '../src/modules/Contact/Contact.Domain/ValueObjects/PersonName';
import { PhoneNumber } from '../src/modules/Contact/Contact.Domain/ValueObjects/PhoneNumber';
import { RequestedServiceReference } from '../src/modules/Contact/Contact.Domain/ValueObjects/RequestedServiceReference';

function client(
  companyName: string | null = '  Acme  ',
  id = '22222222-2222-4222-8222-222222222222',
): Client {
  return Client.create(new ClientId(id), new PersonName(' Ana ', ' Díaz '), companyName,
    new EmailAddress('ana@example.com'), new PhoneNumber(' 123 '));
}

function input() {
  return {
    id: new ContactRequestId('33333333-3333-4333-8333-333333333333'),
    client: client(),
    tipoSolicitud: TipoSolicitud.SolicitudServicio,
    requestedService: new RequestedServiceReference('11111111-1111-4111-8111-111111111111'),
    message: '  hola  ',
  };
}

test('Client recibe identidad efímera explícita y normaliza sus datos', () => {
  const value = client();
  const next = client(' ', '44444444-4444-4444-8444-444444444444');
  assert.notEqual(value.id.value, next.id.value);
  assert.equal(value.name.firstName, 'Ana');
  assert.equal(value.name.lastName, 'Díaz');
  assert.equal(value.companyName, 'Acme');
  assert.equal(value.phone.value, '123');
  assert.equal(next.companyName, null);
});

test('ContactRequest compone Client, TipoSolicitud y requestedService', () => {
  const request = ContactRequest.create(input());
  assert.equal(request.client.companyName, 'Acme');
  assert.equal(request.message, 'hola');
  assert.equal(request.tipoSolicitud, TipoSolicitud.SolicitudServicio);
  assert.equal(request.requestedService.value, '11111111-1111-4111-8111-111111111111');
  assert.equal(ContactRequest.create({ ...input(), message: ' ' }).message, null);
  assert.equal('email' in request, false);
  assert.equal('phone' in request, false);
  assert.equal('applicantName' in request, false);
});

test('ContactRequest rechaza tipo desconocido y Value Objects inválidos', () => {
  assert.throws(() => ContactRequest.create({
    ...input(), tipoSolicitud: 'UNKNOWN' as TipoSolicitud,
  }), /no es válido/);
  assert.throws(() => new PersonName('', 'Doe'), /nombre/);
  assert.throws(() => new PhoneNumber(' '), /teléfono/);
  assert.throws(() => new RequestedServiceReference('not-a-uuid'), /UUID/);
});

test('TipoSolicitud conserva exclusivamente los valores aprobados', () => {
  assert.deepEqual(Object.values(TipoSolicitud), ['SOLICITUD_INFORMACION', 'SOLICITUD_SERVICIO']);
});

test('Value Objects de Contact conservan igualdad por valor', () => {
  const first = new PersonName('Ana', 'Díaz');
  assert.ok(first.equals(new PersonName('Ana', 'Díaz')));
  assert.ok(new EmailAddress('ana@example.com').equals(new EmailAddress('ana@example.com')));
  const reference = '11111111-1111-4111-8111-111111111111';
  assert.ok(new RequestedServiceReference(reference).equals(new RequestedServiceReference(reference)));
});
