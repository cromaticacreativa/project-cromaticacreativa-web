export interface GeocodeResult {
  label: string;
  latitude: number;
  longitude: number;
}

/**
 * Proxy server-side de geocoding con OpenStreetMap Nominatim. Se ejecuta SOLO al
 * pulsar "Buscar" en la UI (no como autocomplete/typeahead, que la política de
 * Nominatim no permite). Respeta la política de uso: throttle global ~1 req/s,
 * User-Agent identificable, timeout, y un **cache en memoria acotado** (TTL + tamaño
 * máximo) por query normalizada, para no repetir la misma búsqueda contra Nominatim.
 * Ante error/429/5xx/red/timeout devuelve `[]` (la entrada manual sigue disponible).
 */
export const GEOCODE_TTL_MS = 24 * 60 * 60 * 1000; // 24 h
export const GEOCODE_CACHE_MAX = 200;
const GEOCODE_TIMEOUT_MS = 8000;
const MAX_RESULTS = 5;

interface CacheEntry {
  expires: number;
  results: GeocodeResult[];
}
const cache = new Map<string, CacheEntry>();
let lastCallAt = 0;

/** Normaliza la clave: trim + minúsculas + espacios colapsados. */
function normalizeKey(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Solo para tests: reinicia cache y throttle. */
export function __resetGeocodeCache(): void {
  cache.clear();
  lastCallAt = 0;
}
/** Solo para tests: tamaño actual del cache. */
export function __geocodeCacheSize(): number {
  return cache.size;
}

export async function geocodeSearch(
  query: string,
  fetchFn: typeof fetch = fetch,
  now: () => number = Date.now,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
): Promise<GeocodeResult[]> {
  const raw = query.trim();
  if (raw.length < 3) return [];
  const key = normalizeKey(raw);

  const cached = cache.get(key);
  if (cached) {
    if (cached.expires > now()) return cached.results;
    cache.delete(key); // expirado
  }

  const waitMs = 1000 - (now() - lastCallAt);
  if (waitMs > 0) await sleep(waitMs);
  lastCallAt = now();

  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=0&limit=${MAX_RESULTS}&q=${encodeURIComponent(raw)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEOCODE_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetchFn(url, {
      headers: {
        'User-Agent': 'CromaticaCreativaCMS/1.0 (+https://cromaticacreativa.com)',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
  } catch {
    return []; // red / timeout / abort — no se cachea el fallo
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) return []; // incluye 429/5xx — no se cachea

  const data = (await response.json().catch(() => [])) as Array<{
    display_name?: string;
    lat?: string;
    lon?: string;
  }>;
  const results: GeocodeResult[] = Array.isArray(data)
    ? data
        .filter((d) => d.display_name && d.lat && d.lon)
        .slice(0, MAX_RESULTS)
        .map((d) => ({ label: String(d.display_name), latitude: Number(d.lat), longitude: Number(d.lon) }))
    : [];

  // Acota el tamaño: evicta la entrada más antigua (orden de inserción del Map).
  if (cache.size >= GEOCODE_CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { expires: now() + GEOCODE_TTL_MS, results });
  return results;
}
