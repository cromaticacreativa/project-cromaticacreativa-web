import assert from 'node:assert/strict';
import test from 'node:test';
import { BusinessRejectionError, TechnicalError } from '../errors';
import { NestInternalClient } from '../nestClient';

function fakeFetch(status: number, body: unknown): typeof fetch {
  return (async () =>
    ({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    }) as unknown as Response) as unknown as typeof fetch;
}

test('fail closed: sin baseUrl o token no llama a fetch y lanza TechnicalError', async () => {
  let called = false;
  const client = new NestInternalClient({
    baseUrl: undefined,
    token: undefined,
    fetchFn: (async () => {
      called = true;
      return {} as Response;
    }) as unknown as typeof fetch,
  });
  await assert.rejects(client.post('contact-information', {}), TechnicalError);
  assert.equal(called, false);
});

test('devuelve el payload canónico en éxito (200)', async () => {
  const client = new NestInternalClient({
    baseUrl: 'http://localhost:3000',
    token: 't',
    fetchFn: fakeFetch(200, { payload: { number: '+584121234567', display_order: 0 } }),
  });
  const payload = await client.post<{ number: string }>('contact-information', {});
  assert.equal(payload.number, '+584121234567');
});

test('traduce 422 con errors[] a BusinessRejectionError', async () => {
  const client = new NestInternalClient({
    baseUrl: 'http://localhost:3000',
    token: 't',
    fetchFn: fakeFetch(422, {
      statusCode: 422,
      message: 'Hay errores de validación.',
      errors: [{ field: 'number', message: 'Formato inválido.' }],
    }),
  });
  await assert.rejects(client.post('contact-information', {}), (error: BusinessRejectionError) => {
    assert.ok(error instanceof BusinessRejectionError);
    assert.equal(error.status, 422);
    assert.deepEqual(error.errors, [{ field: 'number', message: 'Formato inválido.' }]);
    return true;
  });
});

test('5xx se degrada a TechnicalError', async () => {
  const client = new NestInternalClient({
    baseUrl: 'http://localhost:3000',
    token: 't',
    fetchFn: fakeFetch(500, { message: 'boom' }),
  });
  await assert.rejects(client.post('contact-information', {}), TechnicalError);
});

test('caída de red se degrada a TechnicalError', async () => {
  const client = new NestInternalClient({
    baseUrl: 'http://localhost:3000',
    token: 't',
    fetchFn: (async () => {
      throw new Error('ECONNREFUSED');
    }) as unknown as typeof fetch,
  });
  await assert.rejects(client.post('contact-information', {}), TechnicalError);
});
