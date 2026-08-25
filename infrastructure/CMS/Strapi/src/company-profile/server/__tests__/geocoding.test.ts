import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';
import {
  __geocodeCacheSize,
  __resetGeocodeCache,
  geocodeSearch,
  GEOCODE_CACHE_MAX,
  GEOCODE_TTL_MS,
} from '../geocoding';

// El cache es a nivel de módulo: aislar cada test.
beforeEach(() => __resetGeocodeCache());

const noSleep = async () => {};
const now = () => 1_000_000; // fijo; evita esperas por throttle en tests

function countingFetch(payload: unknown): { fetchFn: typeof fetch; calls: () => number } {
  let n = 0;
  const fetchFn = (async () => {
    n += 1;
    return { ok: true, json: async () => payload } as unknown as Response;
  }) as unknown as typeof fetch;
  return { fetchFn, calls: () => n };
}

const CARACAS = [{ display_name: 'Caracas, Venezuela', lat: '10.5', lon: '-66.9' }];

test('devuelve [] para consultas de menos de 3 caracteres (no llama a la red)', async () => {
  let called = false;
  const fetchFn = (async () => {
    called = true;
    return {} as Response;
  }) as unknown as typeof fetch;
  assert.deepEqual(await geocodeSearch('ab', fetchFn, now, noSleep), []);
  assert.equal(called, false);
});

test('mapea resultados de Nominatim a {label, latitude, longitude}', async () => {
  const fetchFn = (async () =>
    ({
      ok: true,
      json: async () => [
        { display_name: 'Caracas, Venezuela', lat: '10.5', lon: '-66.9' },
        { display_name: 'Sin coords' },
      ],
    }) as unknown as Response) as unknown as typeof fetch;
  const res = await geocodeSearch('Caracas', fetchFn, now, noSleep);
  assert.deepEqual(res, [{ label: 'Caracas, Venezuela', latitude: 10.5, longitude: -66.9 }]);
});

test('devuelve [] ante 429/error sin romper (permite entrada manual)', async () => {
  const fetchFn = (async () => ({ ok: false, json: async () => ({}) }) as unknown as Response) as unknown as typeof fetch;
  assert.deepEqual(await geocodeSearch('Caracas', fetchFn, now, noSleep), []);
});

test('devuelve [] ante caída de red', async () => {
  const fetchFn = (async () => {
    throw new Error('network');
  }) as unknown as typeof fetch;
  assert.deepEqual(await geocodeSearch('Caracas', fetchFn, now, noSleep), []);
});

test('cachea por query normalizada: la segunda búsqueda no vuelve a llamar a Nominatim', async () => {
  __resetGeocodeCache();
  const { fetchFn, calls } = countingFetch(CARACAS);
  await geocodeSearch('Av. Principal', fetchFn, now, noSleep);
  await geocodeSearch('  av.   principal ', fetchFn, now, noSleep); // misma clave normalizada
  assert.equal(calls(), 1);
});

test('el TTL expira: tras GEOCODE_TTL_MS vuelve a consultar', async () => {
  __resetGeocodeCache();
  const { fetchFn, calls } = countingFetch(CARACAS);
  await geocodeSearch('Plaza', fetchFn, () => 1_000_000, noSleep);
  await geocodeSearch('Plaza', fetchFn, () => 1_000_000 + GEOCODE_TTL_MS + 1, noSleep);
  assert.equal(calls(), 2);
});

test('el cache está acotado: nunca supera GEOCODE_CACHE_MAX', async () => {
  __resetGeocodeCache();
  const { fetchFn } = countingFetch(CARACAS);
  for (let i = 0; i < GEOCODE_CACHE_MAX + 25; i += 1) {
    await geocodeSearch(`consulta numero ${i}`, fetchFn, now, noSleep);
  }
  assert.ok(__geocodeCacheSize() <= GEOCODE_CACHE_MAX);
});
