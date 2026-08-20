import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';

type FilterHandler = (payload: Record<string, unknown>) => Promise<Record<string, unknown>>;
type HookModule = { default: (register: { filter: (event: string, handler: FilterHandler) => void }, context: { logger: unknown }) => void };

const HOOK_PATH = resolve(
  __dirname,
  '../../../infrastructure/CMS/Directus/extensions/company-profile/index.js',
);

const originalFetch = globalThis.fetch;
const logger = { warn(): void {} };

async function registrarFiltros(): Promise<Map<string, FilterHandler>> {
  const modulo = (await import(pathToFileURL(HOOK_PATH).href)) as HookModule;
  const registrados = new Map<string, FilterHandler>();
  modulo.default({ filter: (event, handler) => registrados.set(event, handler) }, { logger });
  return registrados;
}

function conEntorno(overrides: Record<string, string | undefined>): () => void {
  const previo: Record<string, string | undefined> = {};
  for (const [clave, valor] of Object.entries(overrides)) {
    previo[clave] = process.env[clave];
    if (valor === undefined) delete process.env[clave];
    else process.env[clave] = valor;
  }
  return () => {
    for (const [clave, valor] of Object.entries(previo)) {
      if (valor === undefined) delete process.env[clave];
      else process.env[clave] = valor;
    }
  };
}

test('el Hook intercepta las creaciones de CompanyProfile y el update del correo receptor', async () => {
  const filtros = await registrarFiltros();
  assert.deepEqual(
    [...filtros.keys()].sort(),
    ['company_profile.items.update', 'email.items.create', 'location.items.create', 'phone.items.create', 'social_link.items.create'],
  );
  // Delete y updates de children (HU25/eliminación) siguen pendientes: no se interceptan.
  assert.equal(filtros.has('phone.items.update'), false);
  assert.equal(filtros.has('location.items.update'), false);
  assert.equal(filtros.has('location.items.delete'), false);
});

test('el update del singleton sin correo receptor no contacta al backend y pasa sin cambios', async () => {
  const restaurar = conEntorno({ BACKEND_INTERNAL_URL: 'http://localhost:3000', BACKEND_INTERNAL_TOKEN: 'secreto' });
  let llamado = false;
  globalThis.fetch = (async () => { llamado = true; return { ok: true, status: 200, json: async () => ({ payload: {} }) }; }) as unknown as typeof fetch;
  try {
    const filtros = await registrarFiltros();
    const entrada = { some_other_field: 'x' };
    const salida = await filtros.get('company_profile.items.update')!(entrada);
    assert.deepEqual(salida, entrada);
    assert.equal(llamado, false);
  } finally {
    globalThis.fetch = originalFetch;
    restaurar();
  }
});

test('el update del correo receptor válido persiste el valor canónico y preserva el resto', async () => {
  const restaurar = conEntorno({ BACKEND_INTERNAL_URL: 'http://localhost:3000', BACKEND_INTERNAL_TOKEN: 'secreto' });
  let solicitud: { url: string; body: unknown } | null = null;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    solicitud = { url, body: JSON.parse(init.body as string) };
    return { ok: true, status: 200, json: async () => ({ payload: { contact_request_recipient_email: 'ventas@empresa.com' } }) };
  }) as unknown as typeof fetch;
  try {
    const filtros = await registrarFiltros();
    const salida = await filtros.get('company_profile.items.update')!({ contact_request_recipient_email: 'Ventas@EMPRESA.com', otro: 1 });
    assert.deepEqual(salida, { contact_request_recipient_email: 'ventas@empresa.com', otro: 1 });
    assert.equal(solicitud!.url, 'http://localhost:3000/internal/cms/company-profile/contact-request-recipient-email');
    assert.deepEqual(solicitud!.body, { collection: 'company_profile', payload: { contact_request_recipient_email: 'Ventas@EMPRESA.com' } });
  } finally {
    globalThis.fetch = originalFetch;
    restaurar();
  }
});

test('el update del correo receptor inválido (422) se relanza como DirectusError y NO persiste', async () => {
  const restaurar = conEntorno({ BACKEND_INTERNAL_URL: 'http://localhost:3000', BACKEND_INTERNAL_TOKEN: 'secreto' });
  globalThis.fetch = (async () => ({
    ok: false,
    status: 422,
    json: async () => ({ statusCode: 422, message: 'El correo receptor de solicitudes no es una dirección de correo válida.', errors: [{ field: 'contact_request_recipient_email', message: 'El correo receptor de solicitudes no es una dirección de correo válida.' }] }),
  })) as unknown as typeof fetch;
  try {
    const filtros = await registrarFiltros();
    await assert.rejects(filtros.get('company_profile.items.update')!({ contact_request_recipient_email: 'aaaa' }), (error: unknown) => {
      const e = error as { name?: string; status?: number; message?: string };
      assert.equal(e.name, 'DirectusError');
      assert.equal(e.status, 422);
      assert.match(String(e.message), /correo receptor de solicitudes no es una dirección de correo válida/);
      return true;
    });
  } finally {
    globalThis.fetch = originalFetch;
    restaurar();
  }
});

test('el update del correo receptor falla cerrado sin configuración del backend', async () => {
  const restaurar = conEntorno({ BACKEND_INTERNAL_URL: undefined, BACKEND_INTERNAL_TOKEN: undefined });
  let llamado = false;
  globalThis.fetch = (async () => { llamado = true; return { ok: true, status: 200, json: async () => ({ payload: {} }) }; }) as unknown as typeof fetch;
  try {
    const filtros = await registrarFiltros();
    await assert.rejects(filtros.get('company_profile.items.update')!({ contact_request_recipient_email: 'contacto@empresa.com' }), /falta la variable de entorno/);
    assert.equal(llamado, false);
  } finally {
    globalThis.fetch = originalFetch;
    restaurar();
  }
});

test('una creación de ubicación aprobada usa la ruta y el payload canónico', async () => {
  const restaurar = conEntorno({ BACKEND_INTERNAL_URL: 'http://localhost:3000', BACKEND_INTERNAL_TOKEN: 'secreto' });
  let solicitud: { url: string; init: RequestInit } | null = null;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    solicitud = { url, init };
    return {
      ok: true,
      status: 200,
      json: async () => ({ payload: { company_profile_id: 'id-singleton', address: 'Av. Principal', latitude: 10.48, longitude: -66.9 } }),
    };
  }) as unknown as typeof fetch;

  try {
    const filtros = await registrarFiltros();
    const resultado = await filtros.get('location.items.create')!({ address: '  Av. Principal  ', company_profile_id: 'suplantado' });
    assert.deepEqual(resultado, { company_profile_id: 'id-singleton', address: 'Av. Principal', latitude: 10.48, longitude: -66.9 });
    assert.equal(solicitud!.url, 'http://localhost:3000/internal/cms/company-profile/location');
    assert.equal((solicitud!.init.headers as Record<string, string>).authorization, 'Bearer secreto');
    assert.deepEqual(JSON.parse(solicitud!.init.body as string), {
      collection: 'location',
      payload: { address: '  Av. Principal  ', company_profile_id: 'suplantado' },
    });
  } finally {
    globalThis.fetch = originalFetch;
    restaurar();
  }
});

test('una creación de ubicación rechazada por el backend cancela la persistencia', async () => {
  const restaurar = conEntorno({ BACKEND_INTERNAL_URL: 'http://localhost:3000', BACKEND_INTERNAL_TOKEN: 'secreto' });
  globalThis.fetch = (async () => ({ ok: false, status: 422, json: async () => ({}) })) as unknown as typeof fetch;
  try {
    const filtros = await registrarFiltros();
    await assert.rejects(filtros.get('location.items.create')!({ address: 'Av. Principal' }), /rechazada por el backend/);
  } finally {
    globalThis.fetch = originalFetch;
    restaurar();
  }
});

test('una creación de ubicación falla cerrado sin configuración del backend interno', async () => {
  const restaurar = conEntorno({ BACKEND_INTERNAL_URL: undefined, BACKEND_INTERNAL_TOKEN: undefined });
  let llamado = false;
  globalThis.fetch = (async () => { llamado = true; return { ok: true, status: 200, json: async () => ({ payload: {} }) }; }) as unknown as typeof fetch;
  try {
    const filtros = await registrarFiltros();
    await assert.rejects(filtros.get('location.items.create')!({ address: 'Av. Principal' }), /falta la variable de entorno/);
    assert.equal(llamado, false);
  } finally {
    globalThis.fetch = originalFetch;
    restaurar();
  }
});

test('una creación aprobada devuelve el payload canónico con Bearer token', async () => {
  const restaurar = conEntorno({ BACKEND_INTERNAL_URL: 'http://localhost:3000', BACKEND_INTERNAL_TOKEN: 'secreto' });
  let solicitud: { url: string; init: RequestInit } | null = null;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    solicitud = { url, init };
    return { ok: true, status: 200, json: async () => ({ payload: { number: '+584121234567', display_order: 0 } }) };
  }) as unknown as typeof fetch;

  try {
    const filtros = await registrarFiltros();
    const resultado = await filtros.get('phone.items.create')!({ number: ' +58 0412 1234567 ', foo: 'bar' });
    // Allowlist: el campo desconocido 'foo' NO sobrevive; solo el payload canónico.
    assert.deepEqual(resultado, { number: '+584121234567', display_order: 0 });
    assert.equal(solicitud!.url, 'http://localhost:3000/internal/cms/company-profile/contact-information');
    assert.equal((solicitud!.init.headers as Record<string, string>).authorization, 'Bearer secreto');
    assert.deepEqual(JSON.parse(solicitud!.init.body as string), {
      collection: 'phone',
      payload: { number: ' +58 0412 1234567 ', foo: 'bar' },
    });
  } finally {
    globalThis.fetch = originalFetch;
    restaurar();
  }
});

test('un rechazo del backend cancela la creación (fail closed)', async () => {
  const restaurar = conEntorno({ BACKEND_INTERNAL_URL: 'http://localhost:3000', BACKEND_INTERNAL_TOKEN: 'secreto' });
  globalThis.fetch = (async () => ({ ok: false, status: 422, json: async () => ({}) })) as unknown as typeof fetch;
  try {
    const filtros = await registrarFiltros();
    await assert.rejects(filtros.get('email.items.create')!({ address: 'a@b.com' }), /rechazada por el backend/);
  } finally {
    globalThis.fetch = originalFetch;
    restaurar();
  }
});

test('un 401/403 del backend cancela la creación con mensaje genérico', async () => {
  const restaurar = conEntorno({ BACKEND_INTERNAL_URL: 'http://localhost:3000', BACKEND_INTERNAL_TOKEN: 'secreto' });
  globalThis.fetch = (async () => ({ ok: false, status: 401, json: async () => ({}) })) as unknown as typeof fetch;
  try {
    const filtros = await registrarFiltros();
    await assert.rejects(filtros.get('phone.items.create')!({ number: '+584121234567' }), /No fue posible procesar/);
  } finally {
    globalThis.fetch = originalFetch;
    restaurar();
  }
});

test('el backend caído cancela la creación', async () => {
  const restaurar = conEntorno({ BACKEND_INTERNAL_URL: 'http://localhost:3000', BACKEND_INTERNAL_TOKEN: 'secreto' });
  globalThis.fetch = (async () => { throw new Error('ECONNREFUSED'); }) as unknown as typeof fetch;
  try {
    const filtros = await registrarFiltros();
    await assert.rejects(filtros.get('phone.items.create')!({ number: '+584121234567' }), /No fue posible procesar/);
  } finally {
    globalThis.fetch = originalFetch;
    restaurar();
  }
});

test('un timeout cancela la creación', async () => {
  const restaurar = conEntorno({
    BACKEND_INTERNAL_URL: 'http://localhost:3000',
    BACKEND_INTERNAL_TOKEN: 'secreto',
    BACKEND_INTERNAL_TIMEOUT_MS: '10',
  });
  globalThis.fetch = ((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
    init.signal?.addEventListener('abort', () => reject(new Error('AbortError')));
  })) as unknown as typeof fetch;
  try {
    const filtros = await registrarFiltros();
    await assert.rejects(filtros.get('phone.items.create')!({ number: '+584121234567' }), /No fue posible procesar/);
  } finally {
    globalThis.fetch = originalFetch;
    restaurar();
  }
});

test('una respuesta inesperada cancela la creación', async () => {
  const restaurar = conEntorno({ BACKEND_INTERNAL_URL: 'http://localhost:3000', BACKEND_INTERNAL_TOKEN: 'secreto' });
  globalThis.fetch = (async () => ({ ok: true, status: 200, json: async () => ({ sin: 'payload' }) })) as unknown as typeof fetch;
  try {
    const filtros = await registrarFiltros();
    await assert.rejects(filtros.get('phone.items.create')!({ number: '+584121234567' }), /No fue posible procesar/);
  } finally {
    globalThis.fetch = originalFetch;
    restaurar();
  }
});

test('falla cerrado cuando falta configuración del backend interno', async () => {
  const restaurar = conEntorno({ BACKEND_INTERNAL_URL: undefined, BACKEND_INTERNAL_TOKEN: undefined });
  let llamado = false;
  globalThis.fetch = (async () => { llamado = true; return { ok: true, status: 200, json: async () => ({ payload: {} }) }; }) as unknown as typeof fetch;
  try {
    const filtros = await registrarFiltros();
    await assert.rejects(filtros.get('phone.items.create')!({ number: '+584121234567' }), /falta la variable de entorno/);
    assert.equal(llamado, false, 'no debe intentar contactar al backend sin configuración');
  } finally {
    globalThis.fetch = originalFetch;
    restaurar();
  }
});

type ErrorDirectus = Error & { code: string; status: number; extensions: Record<string, unknown> };

function esErrorDirectus(valor: unknown): valor is ErrorDirectus {
  return valor instanceof Error && (valor as { name?: string }).name === 'DirectusError';
}

test('un rechazo de negocio (422) se relanza como DirectusError con status/code (sin INTERNAL_SERVER_ERROR)', async () => {
  const restaurar = conEntorno({ BACKEND_INTERNAL_URL: 'http://localhost:3000', BACKEND_INTERNAL_TOKEN: 'secreto' });
  globalThis.fetch = (async () => ({
    ok: false,
    status: 422,
    json: async () => ({ statusCode: 422, message: 'La dirección de correo electrónico no es válida.', error: 'Unprocessable Entity' }),
  })) as unknown as typeof fetch;
  try {
    const filtros = await registrarFiltros();
    await assert.rejects(filtros.get('email.items.create')!({ address: 'hola' }), (error: unknown) => {
      assert.ok(esErrorDirectus(error));
      assert.equal(error.name, 'DirectusError');
      assert.equal(error.status, 422);
      assert.equal(error.code, 'FAILED_VALIDATION');
      assert.equal(error.message, 'La dirección de correo electrónico no es válida.');
      assert.notEqual(error.code, 'INTERNAL_SERVER_ERROR');
      return true;
    });
  } finally {
    globalThis.fetch = originalFetch;
    restaurar();
  }
});

test('un 422 con errors[] múltiples se relanza como un arreglo de DirectusError por campo', async () => {
  const restaurar = conEntorno({ BACKEND_INTERNAL_URL: 'http://localhost:3000', BACKEND_INTERNAL_TOKEN: 'secreto' });
  globalThis.fetch = (async () => ({
    ok: false,
    status: 422,
    json: async () => ({
      statusCode: 422,
      message: 'Hay errores de validación.',
      errors: [
        { field: 'address', message: 'La dirección no puede estar vacía.' },
        { field: 'latitude', message: 'La latitud debe estar entre -90 y 90.' },
        { field: 'longitude', message: 'La longitud debe estar entre -180 y 180.' },
      ],
    }),
  })) as unknown as typeof fetch;
  try {
    const filtros = await registrarFiltros();
    let capturado: unknown;
    try {
      await filtros.get('location.items.create')!({ address: '', latitude: 200, longitude: -500 });
      assert.fail('debía rechazar');
    } catch (error) {
      capturado = error;
    }
    assert.ok(Array.isArray(capturado));
    const errores = capturado as ErrorDirectus[];
    assert.equal(errores.length, 3);
    for (const error of errores) {
      assert.ok(esErrorDirectus(error));
      assert.equal(error.status, 422); // status uniforme: Directus responde 422, no 500
      assert.equal(error.code, 'FAILED_VALIDATION');
      assert.equal(error.extensions['collection'], 'location');
    }
    assert.deepEqual(errores.map((e) => e.extensions['field']), ['address', 'latitude', 'longitude']);
    assert.deepEqual(errores.map((e) => e.message), [
      'La dirección no puede estar vacía.',
      'La latitud debe estar entre -90 y 90.',
      'La longitud debe estar entre -180 y 180.',
    ]);
  } finally {
    globalThis.fetch = originalFetch;
    restaurar();
  }
});

test('un 422 con un solo errors[] se relanza como un único DirectusError con field', async () => {
  const restaurar = conEntorno({ BACKEND_INTERNAL_URL: 'http://localhost:3000', BACKEND_INTERNAL_TOKEN: 'secreto' });
  globalThis.fetch = (async () => ({
    ok: false,
    status: 422,
    json: async () => ({ statusCode: 422, message: 'La latitud debe estar entre -90 y 90.', errors: [{ field: 'latitude', message: 'La latitud debe estar entre -90 y 90.' }] }),
  })) as unknown as typeof fetch;
  try {
    const filtros = await registrarFiltros();
    await assert.rejects(filtros.get('location.items.create')!({ latitude: 999 }), (error: unknown) => {
      assert.ok(esErrorDirectus(error));
      assert.equal(Array.isArray(error), false);
      assert.equal(error.status, 422);
      assert.equal(error.extensions['field'], 'latitude');
      assert.equal(error.message, 'La latitud debe estar entre -90 y 90.');
      return true;
    });
  } finally {
    globalThis.fetch = originalFetch;
    restaurar();
  }
});

test('un conflicto de negocio (409) se relanza como DirectusError RECORD_NOT_UNIQUE con el mensaje', async () => {
  const restaurar = conEntorno({ BACKEND_INTERNAL_URL: 'http://localhost:3000', BACKEND_INTERNAL_TOKEN: 'secreto' });
  globalThis.fetch = (async () => ({
    ok: false,
    status: 409,
    json: async () => ({ statusCode: 409, message: 'Este correo electrónico ya está registrado.', errors: [{ field: 'address', message: 'Este correo electrónico ya está registrado.' }] }),
  })) as unknown as typeof fetch;
  try {
    const filtros = await registrarFiltros();
    await assert.rejects(filtros.get('email.items.create')!({ address: 'ventas@gmail.com' }), (error: unknown) => {
      assert.ok(esErrorDirectus(error));
      assert.equal(error.status, 409);
      assert.equal(error.code, 'RECORD_NOT_UNIQUE');
      assert.equal(error.extensions['field'], 'address');
      assert.equal(error.message, 'Este correo electrónico ya está registrado.');
      return true;
    });
  } finally {
    globalThis.fetch = originalFetch;
    restaurar();
  }
});

test('los status fuera de la allowlist (401/403/404/429) NO filtran su mensaje interno', async () => {
  const restaurar = conEntorno({ BACKEND_INTERNAL_URL: 'http://localhost:3000', BACKEND_INTERNAL_TOKEN: 'secreto' });
  const casos: Array<[number, string]> = [
    [401, 'Unauthorized'],
    [403, 'Forbidden'],
    [404, 'Not Found'],
    [429, 'Too Many Requests'],
  ];
  try {
    for (const [status, message] of casos) {
      globalThis.fetch = (async () => ({ ok: false, status, json: async () => ({ statusCode: status, message }) })) as unknown as typeof fetch;
      const filtros = await registrarFiltros();
      await assert.rejects(filtros.get('phone.items.create')!({ number: '+584121234567' }), (error: Error) => {
        assert.match(error.message, /No fue posible procesar la solicitud en este momento\./);
        assert.doesNotMatch(error.message, new RegExp(message));
        return true;
      });
    }
  } finally {
    globalThis.fetch = originalFetch;
    restaurar();
  }
});

test('un error técnico (500) NO filtra el mensaje interno; muestra uno genérico', async () => {
  const restaurar = conEntorno({ BACKEND_INTERNAL_URL: 'http://localhost:3000', BACKEND_INTERNAL_TOKEN: 'secreto-super-sensible' });
  globalThis.fetch = (async () => ({
    ok: false,
    status: 500,
    json: async () => ({ statusCode: 500, message: "ER_DUP_ENTRY: Duplicate entry for key 'uq_email' at /app/src/... SELECT * FROM email" }),
  })) as unknown as typeof fetch;
  try {
    const filtros = await registrarFiltros();
    await assert.rejects(filtros.get('email.items.create')!({ address: 'a@b.com' }), (error: Error) => {
      assert.match(error.message, /No fue posible procesar la solicitud en este momento\./);
      assert.doesNotMatch(error.message, /ER_DUP_ENTRY|SELECT|SQL|uq_email|\/app\//i);
      assert.doesNotMatch(error.message, /secreto-super-sensible/);
      return true;
    });
  } finally {
    globalThis.fetch = originalFetch;
    restaurar();
  }
});

test('el payload canónico impone company_profile_id del backend, descarta campos desconocidos y preserva id técnico', async () => {
  const restaurar = conEntorno({ BACKEND_INTERNAL_URL: 'http://localhost:3000', BACKEND_INTERNAL_TOKEN: 'secreto' });
  globalThis.fetch = (async () => ({
    ok: true,
    status: 200,
    json: async () => ({ payload: { company_profile_id: 'id-real-del-backend', number: '+584121234567', display_order: 0 } }),
  })) as unknown as typeof fetch;
  try {
    const filtros = await registrarFiltros();
    const resultado = await filtros.get('phone.items.create')!({
      id: 'uuid-generado-por-directus',
      number: '+58 0412 1234567',
      company_profile_id: 'id-suplantado',
      display_order: 999,
      campo_malicioso: 'x',
    });
    assert.deepEqual(resultado, {
      id: 'uuid-generado-por-directus',
      company_profile_id: 'id-real-del-backend',
      number: '+584121234567',
      display_order: 0,
    });
  } finally {
    globalThis.fetch = originalFetch;
    restaurar();
  }
});
