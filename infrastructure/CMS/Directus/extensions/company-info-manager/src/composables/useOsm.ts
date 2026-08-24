/**
 * Fuente ÚNICA de verdad del mapa administrativo: OpenStreetMap + Leaflet +
 * búsqueda con Nominatim. Antes vivía duplicado en dos extensiones; ahora la
 * lógica (constantes, fetch/timeout, tileLayer, marcador, click, drag,
 * invalidateSize, ResizeObserver, redondeo, mensajes) está aquí y la consume el
 * componente `OsmLocationPicker.vue`. Sin Google Maps ni API keys.
 */
import L from 'leaflet';

export interface Resultado {
  display_name: string;
  lat: number;
  lon: number;
}

export const MENSAJE_SIN_RESULTADOS = 'No se encontraron ubicaciones para esta búsqueda.';
export const MENSAJE_SERVICIO = 'No fue posible consultar el servicio de ubicaciones. Inténtalo nuevamente.';
export const MENSAJE_MAPA = 'No fue posible cargar el mapa.';
export const MENSAJE_TILES = 'No fue posible cargar el mapa. Inténtalo nuevamente.';

// URL oficial de tiles de OpenStreetMap (sin subdominios `{s}`): un solo host,
// que simplifica la CSP a `https://tile.openstreetmap.org`. Se conserva la
// atribución obligatoria. El proveedor puede cambiarse aquí sin tocar Domain/DB.
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const LIMITE_RESULTADOS = 8;
const TIMEOUT_MS = 8000;

export function redondear(n: number): number {
  return Number(n.toFixed(6));
}

/**
 * Busca lugares con Nominatim respetando su Usage Policy (por botón, no por
 * tecla; timeout; límite). Devuelve resultados o un mensaje UX en español; nunca
 * lanza detalles técnicos.
 */
export async function buscarUbicaciones(texto: string): Promise<{ resultados: Resultado[]; mensaje: string }> {
  const q = texto.trim();
  if (!q) return { resultados: [], mensaje: '' };
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_MS);
  try {
    const url = `${NOMINATIM_URL}?format=jsonv2&addressdetails=0&limit=${LIMITE_RESULTADOS}&q=${encodeURIComponent(q)}`;
    const r = await fetch(url, { headers: { Accept: 'application/json', 'Accept-Language': 'es' }, signal: controlador.signal });
    if (!r.ok) return { resultados: [], mensaje: MENSAJE_SERVICIO };
    const datos = await r.json();
    if (!Array.isArray(datos) || datos.length === 0) return { resultados: [], mensaje: MENSAJE_SIN_RESULTADOS };
    const resultados = (datos as Record<string, unknown>[])
      .map((d) => ({ display_name: String(d.display_name ?? ''), lat: Number(d.lat), lon: Number(d.lon) }))
      .filter((x): x is Resultado => x.display_name.length > 0 && Number.isFinite(x.lat) && Number.isFinite(x.lon))
      .slice(0, LIMITE_RESULTADOS);
    return { resultados, mensaje: resultados.length > 0 ? '' : MENSAJE_SIN_RESULTADOS };
  } catch {
    return { resultados: [], mensaje: MENSAJE_SERVICIO };
  } finally {
    clearTimeout(temporizador);
  }
}

export interface ControladorMapa {
  /** Coloca/mueve el único marcador y notifica las coordenadas (6 decimales). */
  fijar(lat: number, lng: number, centrar?: boolean): void;
  destruir(): void;
}

/**
 * Inicializa Leaflet + tiles OSM en `el`. `onCambio` recibe lat/lng redondeadas
 * cuando el usuario elige un resultado, hace click o arrastra el marcador. Se
 * conserva la atribución OSM y se recalcula el tamaño (invalidateSize) al montar y
 * ante cada resize del contenedor (nunca en bucle).
 */
export function crearControladorMapa(
  el: HTMLElement,
  onCambio: (lat: number, lng: number) => void,
  opciones: { lat?: number; lng?: number; zoom?: number; onFalloTiles?: () => void } = {},
): ControladorMapa {
  const centro: [number, number] = [opciones.lat ?? 10.4806, opciones.lng ?? -66.9036];
  const map = L.map(el, { center: centro, zoom: opciones.zoom ?? 12 });
  const capa = L.tileLayer(TILE_URL, {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors',
  });
  // Detección de fallo REAL de tiles (p. ej. CSP): si tras un margen no cargó
  // ninguna tile pero hubo errores, se avisa una sola vez. No se dispara por el
  // fallo de una tile individual.
  let tilesOk = 0;
  let tilesErr = 0;
  capa.on('load', () => { tilesOk += 1; });
  capa.on('tileerror', () => { tilesErr += 1; });
  if (opciones.onFalloTiles) {
    setTimeout(() => { if (tilesOk === 0 && tilesErr > 0) opciones.onFalloTiles!(); }, 5000);
  }
  capa.addTo(map);
  const icono = L.divIcon({ className: 'osm-pin', html: '<span aria-hidden="true">📍</span>', iconSize: [28, 28], iconAnchor: [14, 26] });

  let marcador: L.Marker | null = null;
  let observer: ResizeObserver | null = null;

  function fijar(lat: number, lng: number, centrar = false): void {
    if (marcador) {
      marcador.setLatLng([lat, lng]);
    } else {
      marcador = L.marker([lat, lng], { icon: icono, draggable: true });
      marcador.on('dragend', () => {
        const p = marcador!.getLatLng();
        onCambio(redondear(p.lat), redondear(p.lng));
      });
      marcador.addTo(map);
    }
    if (centrar) map.setView([lat, lng], Math.max(map.getZoom(), 16));
    onCambio(redondear(lat), redondear(lng));
  }

  map.on('click', (e: L.LeafletMouseEvent) => fijar(e.latlng.lat, e.latlng.lng, false));

  const recalcular = (): void => map.invalidateSize();
  requestAnimationFrame(recalcular);
  setTimeout(recalcular, 250);
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(() => recalcular());
    observer.observe(el);
  }

  return {
    fijar,
    destruir(): void {
      observer?.disconnect();
      observer = null;
      map.remove();
      marcador = null;
    },
  };
}
