<script setup lang="ts">
/**
 * Componente reutilizable del mapa (OpenStreetMap + Leaflet + Nominatim). Única
 * implementación del mapa administrativo (ya no hay una extensión aparte). Emite
 * las coordenadas elegidas; la Dirección la escribe el administrador (manual).
 */
import { onBeforeUnmount, onMounted, ref } from 'vue';
import 'leaflet/dist/leaflet.css';
import { buscarUbicaciones, crearControladorMapa, MENSAJE_MAPA, MENSAJE_TILES, type ControladorMapa, type Resultado } from '../composables/useOsm';

const props = defineProps<{ initialLat?: number | null; initialLng?: number | null }>();

const emit = defineEmits<{
  (e: 'coords', p: { latitude: number; longitude: number }): void;
  (e: 'use-address', v: string): void;
}>();

const mapEl = ref<HTMLElement | null>(null);
const busqueda = ref('');
const resultados = ref<Resultado[]>([]);
const buscando = ref(false);
const mensaje = ref('');
const referencia = ref('');
const coordsTexto = ref('');
let ctrl: ControladorMapa | null = null;

function alCambiar(lat: number, lng: number): void {
  coordsTexto.value = `${lat}, ${lng}`;
  emit('coords', { latitude: lat, longitude: lng });
}

async function buscar(): Promise<void> {
  if (buscando.value) return;
  buscando.value = true;
  mensaje.value = '';
  resultados.value = [];
  const r = await buscarUbicaciones(busqueda.value);
  resultados.value = r.resultados;
  mensaje.value = r.mensaje;
  buscando.value = false;
}

function elegir(r: Resultado): void {
  referencia.value = r.display_name;
  ctrl?.fijar(r.lat, r.lon, true);
}

function usarDireccion(): void {
  if (referencia.value) emit('use-address', referencia.value);
}

onMounted(() => {
  if (!mapEl.value) return;
  try {
    const lat = props.initialLat;
    const lng = props.initialLng;
    const tiene = typeof lat === 'number' && Number.isFinite(lat) && typeof lng === 'number' && Number.isFinite(lng);
    ctrl = crearControladorMapa(mapEl.value, alCambiar, {
      onFalloTiles: () => { mensaje.value = MENSAJE_TILES; },
      ...(tiene ? { lat: lat as number, lng: lng as number, zoom: 16 } : {}),
    });
    // Al editar: coloca el marcador en la ubicación actual (centrada).
    if (tiene) ctrl.fijar(lat as number, lng as number, true);
  } catch {
    mensaje.value = MENSAJE_MAPA;
  }
});

onBeforeUnmount(() => {
  ctrl?.destruir();
  ctrl = null;
});
</script>

<template>
  <div class="osm">
    <div class="osm-search">
      <input v-model="busqueda" type="text" placeholder="Escriba una calle, avenida, edificio o lugar…" aria-label="Buscar ubicación" @keydown.enter.prevent="buscar" />
      <button type="button" class="osm-btn" :disabled="buscando" @click="buscar">{{ buscando ? 'Buscando…' : 'Buscar' }}</button>
    </div>
    <p v-if="mensaje" class="osm-msg" role="status">{{ mensaje }}</p>
    <ul v-if="resultados.length" class="osm-results">
      <li v-for="(r, i) in resultados" :key="i"><button type="button" @click="elegir(r)">{{ r.display_name }}</button></li>
    </ul>
    <div ref="mapEl" class="osm-map" aria-label="Mapa para seleccionar la ubicación"></div>
    <div class="osm-foot">
      <span v-if="coordsTexto" class="osm-coords">Punto seleccionado: {{ coordsTexto }}</span>
      <template v-if="referencia">
        <span class="osm-ref">Ubicación encontrada: {{ referencia }}</span>
        <button type="button" class="osm-link" @click="usarDireccion">Usar esta dirección</button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.osm { display: flex; flex-direction: column; gap: 8px; width: 100%; max-width: 100%; }
.osm-search { display: flex; gap: 8px; flex-wrap: wrap; }
.osm-search input { flex: 1 1 220px; min-width: 0; padding: 8px 12px; font: inherit; box-sizing: border-box; border: 2px solid var(--theme--form--field--input--border-color, #d3dae4); border-radius: var(--theme--border-radius, 6px); background: var(--theme--form--field--input--background, #fff); color: var(--theme--foreground, #172940); }
.osm-search input:focus { outline: none; border-color: var(--theme--primary, #7c3aed); }
.osm-btn, .osm-link { padding: 8px 16px; border: none; border-radius: var(--theme--border-radius, 6px); background: var(--theme--primary, #7c3aed); color: var(--theme--primary--foreground, #fff); font: inherit; cursor: pointer; white-space: nowrap; }
.osm-btn:disabled { opacity: 0.6; cursor: default; }
.osm-link { background: transparent; color: var(--theme--primary, #7c3aed); padding: 4px 8px; text-decoration: underline; }
.osm-msg { margin: 0; color: var(--theme--foreground-subdued, #4f5464); font-size: 0.9em; }
.osm-results { list-style: none; margin: 0; padding: 0; max-height: 160px; overflow-y: auto; overflow-x: hidden; border: 1px solid var(--theme--border-color-subdued, #ebedf0); border-radius: var(--theme--border-radius, 6px); }
.osm-results button { display: block; width: 100%; text-align: left; padding: 8px 12px; border: none; border-bottom: 1px solid var(--theme--border-color-subdued, #ebedf0); background: var(--theme--background, #fff); color: var(--theme--foreground, #172940); font: inherit; cursor: pointer; white-space: normal; word-break: break-word; min-height: 44px; }
.osm-results button:hover, .osm-results button:focus { background: var(--theme--background-accent, #f0f4f9); outline: none; }
.osm-map { width: 100%; height: 360px; border-radius: var(--theme--border-radius, 6px); border: 1px solid var(--theme--border-color-subdued, #ebedf0); z-index: 0; }
.osm-foot { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; font-size: 0.9em; color: var(--theme--foreground-subdued, #4f5464); }
.osm-ref { word-break: break-word; }
:deep(.osm-pin) { font-size: 24px; line-height: 24px; text-align: center; }
@media (max-width: 599px) { .osm-map { height: 280px; } .osm-search input { flex-basis: 100%; } }
</style>
