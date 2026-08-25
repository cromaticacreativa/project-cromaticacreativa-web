import assert from 'node:assert/strict';
import test from 'node:test';
import { BusinessRejectionError } from '../errors';
import type { NestInternalClient } from '../nestClient';
import { CompanyProfileRepository } from '../repository';
import { CompanyProfileCmsService } from '../service';
import { createFakeKnex, FakeStore } from './fakeKnex';

function fakeNest(impl: (path: string, body: unknown) => Promise<unknown>): NestInternalClient {
  return { post: (path: string, body: unknown) => impl(path, body) } as unknown as NestInternalClient;
}

function setup(store: FakeStore, nest: NestInternalClient) {
  const { knex, calls } = createFakeKnex(store);
  const repo = new CompanyProfileRepository(knex);
  const service = new CompanyProfileCmsService(repo, nest);
  return { service, calls };
}

test('addPhone escribe EXCLUSIVAMENTE el número canónico devuelto por NestJS (no el crudo)', async () => {
  const store: FakeStore = { company_profile: [{ id: 'p1', singleton_key: 1, contact_request_recipient_email: 'a@b.com' }] };
  const nest = fakeNest(async () => ({ company_profile_id: 'p1', number: '+584121234567', display_order: 0 }));
  const { service, calls } = setup(store, nest);

  await service.addPhone('0412-1234567'); // crudo, distinto del canónico

  const inserts = calls.filter((c) => c.table === 'phone' && c.op === 'insert');
  assert.equal(inserts.length, 1); // sin doble escritura
  assert.equal((store['phone']![0] as { number: string }).number, '+584121234567');
  assert.match(String((store['phone']![0] as { id: string }).id), /^[0-9a-f-]{36}$/i); // id técnico generado
});

test('fail closed: si NestJS rechaza, NO se escribe en MySQL', async () => {
  const store: FakeStore = { company_profile: [{ id: 'p1', singleton_key: 1, contact_request_recipient_email: 'a@b.com' }], phone: [] };
  const nest = fakeNest(async () => {
    throw new BusinessRejectionError('Formato inválido.', 422, [{ field: 'number', message: 'x' }]);
  });
  const { service, calls } = setup(store, nest);

  await assert.rejects(service.addPhone('0412'), BusinessRejectionError);
  assert.equal(calls.filter((c) => c.op === 'insert').length, 0);
  assert.equal(store['phone']!.length, 0);
});

test('deletePhone directo elimina y responde 404 si no existe', async () => {
  const id = '22222222-2222-4222-8222-222222222222';
  const store: FakeStore = { phone: [{ id, company_profile_id: 'p1', number: '+58', display_order: 0 }] };
  const { service } = setup(store, fakeNest(async () => ({})));
  await service.deletePhone(id);
  assert.equal(store['phone']!.length, 0);
  await assert.rejects(service.deletePhone(id), (e: BusinessRejectionError) => {
    assert.equal(e.status, 404);
    return true;
  });
});

test('getInformacionGeneral proyecta y ordena por display_order (GET directo)', async () => {
  const store: FakeStore = {
    company_profile: [{ id: 'p1', singleton_key: 1, contact_request_recipient_email: 'r@b.com' }],
    phone: [
      { id: 'a', company_profile_id: 'p1', number: '+2', display_order: 1 },
      { id: 'b', company_profile_id: 'p1', number: '+1', display_order: 0 },
    ],
    location: [{ company_profile_id: 'p1', address: 'Calle 123 alguna', latitude: 10, longitude: -66 }],
  };
  const { service } = setup(store, fakeNest(async () => ({})));
  const view = await service.getInformacionGeneral();
  assert.equal(view.recipientEmail, 'r@b.com');
  assert.deepEqual(view.phones.map((p) => p.number), ['+1', '+2']);
  assert.equal(view.location?.address, 'Calle 123 alguna');
});

test('initialize inserta el singleton con el payload canónico de NestJS', async () => {
  const store: FakeStore = { company_profile: [] };
  const nest = fakeNest(async () => ({ id: 'newid', singleton_key: 1, contact_request_recipient_email: 'canon@b.com' }));
  const { service } = setup(store, nest);
  await service.initialize('canon@b.com');
  assert.equal(store['company_profile']!.length, 1);
  assert.equal((store['company_profile']![0] as { contact_request_recipient_email: string }).contact_request_recipient_email, 'canon@b.com');
});

const UUID_A = '11111111-1111-4111-8111-111111111111';

test('updatePhone con id inexistente responde 404 (no success)', async () => {
  const store: FakeStore = { phone: [] };
  const nest = fakeNest(async () => ({ number: '+584121234567' }));
  const { service } = setup(store, nest);
  await assert.rejects(service.updatePhone(UUID_A, '+584121234567'), (e: BusinessRejectionError) => {
    assert.equal(e.status, 404);
    return true;
  });
});

test('updatePhone idempotente (mismo valor, 0 filas cambiadas) NO falla si el registro existe', async () => {
  const store: FakeStore = { phone: [{ id: UUID_A, company_profile_id: 'p1', number: '+584121234567', display_order: 0 }] };
  const nest = fakeNest(async () => ({ number: '+584121234567' })); // canónico == actual → changed=0
  const { service } = setup(store, nest);
  const view = await service.updatePhone(UUID_A, '+584121234567'); // no debe lanzar
  assert.ok(view.phones.some((p) => p.number === '+584121234567'));
});

test('updatePhone rechaza un id que no es UUID (400) sin llamar a NestJS', async () => {
  let nestCalled = false;
  const nest = fakeNest(async () => { nestCalled = true; return {}; });
  const { service } = setup({ phone: [] }, nest);
  await assert.rejects(service.updatePhone('no-es-uuid', 'x'), (e: BusinessRejectionError) => {
    assert.equal(e.status, 400);
    return true;
  });
  assert.equal(nestCalled, false);
});

test('deletePhone rechaza un id que no es UUID (400)', async () => {
  const { service } = setup({ phone: [] }, fakeNest(async () => ({})));
  await assert.rejects(service.deletePhone('../../etc'), (e: BusinessRejectionError) => {
    assert.equal(e.status, 400);
    return true;
  });
});
