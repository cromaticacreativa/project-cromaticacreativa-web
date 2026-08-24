<script setup lang="ts">
/**
 * Gestor de Información General.
 *
 * CREAR: cada "Crear nuevo" hace un POST top-level con la Items API de Directus
 * (sesión autenticada vía `useApi`; NO se expone ningún token) → Filter Hook del
 * child → NestJS valida → payload canónico → Directus inserta. Persistencia
 * inmediata (un solo Guardar), `company_profile_id` lo fija el backend, y los
 * errores se leen de `errors[]` y se muestran inline por campo (sin
 * `validationError.undefined`). El backend es la autoridad de la creación.
 *
 * ELIMINAR: es una operación puramente administrativa sin regla de negocio
 * adicional, por lo que va DIRECTO a Directus (DELETE /items/<coll>/:id vía la
 * sesión) — sin pasar por NestJS ni por un Hook. Requiere confirmación explícita
 * y persiste de inmediato (sin "Guardar" global). Se hace por id del child, nunca
 * anulando `company_profile_id`.
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import OsmLocationPicker from './components/OsmLocationPicker.vue';

/**
 * Clase que el gestor añade a `document.body` mientras está montado (solo ocurre
 * en la pantalla company_profile). El Custom CSS del proyecto (branding/custom.css)
 * usa esta clase para ocultar el botón "Guardar" global SOLO aquí; nunca afecta a
 * otras colecciones porque la clase no existe fuera de esta pantalla.
 */
const BODY_CLASS = 'cc-info-general';
const RECIPIENT_FIELD = 'contact_request_recipient_email';

interface ErrorCampo { field?: string; message: string }

const api = useApi();

const REDES = ['Instagram', 'Facebook', 'WhatsApp', 'LinkedIn', 'TikTok', 'YouTube', 'X (Twitter)', 'Pinterest', 'Telegram'];
const MENSAJE_TECNICO = 'No fue posible procesar la solicitud en este momento.';

type Coleccion = 'phone' | 'email' | 'social_link' | 'location';

const items = reactive<Record<Coleccion, Record<string, unknown>[]>>({ phone: [], email: [], social_link: [], location: [] });
const cargando = reactive<Record<Coleccion, boolean>>({ phone: false, email: false, social_link: false, location: false });
const abierto = reactive<Record<Coleccion, boolean>>({ phone: false, email: false, social_link: false, location: false });
// id del registro en edición por sección (null = alta / formulario cerrado).
const editando = reactive<Record<Coleccion, string | null>>({ phone: null, email: null, social_link: null, location: null });
const enviando = reactive<Record<Coleccion, boolean>>({ phone: false, email: false, social_link: false, location: false });
const errores = reactive<Record<Coleccion, ErrorCampo[]>>({ phone: [], email: [], social_link: [], location: [] });

const form = reactive({
  number: '',
  address: '',
  network: '',
  networkOtra: '',
  url: '',
  locAddress: '',
  latitude: null as number | null,
  longitude: null as number | null,
});

// ── Correo receptor de solicitudes (guardado propio, sin Guardar global) ────
const recipiente = ref('');
const recipienteOriginal = ref('');
const recipienteErrores = ref<ErrorCampo[]>([]);
const recipienteGuardando = ref(false);
const recipienteOk = ref(false);
// "Sucio": el input difiere del valor persistido → habilita Guardar.
const recipienteSucio = computed(() => recipiente.value !== recipienteOriginal.value);

// ── Estado de eliminación (confirmación explícita) ──────────────────────────
const confirmando = ref<{ coll: Coleccion; id: string; descripcion: string } | null>(null);
const eliminando = ref(false);
const errorEliminar = ref('');

function errorDe(coll: Coleccion, campo: string): string | null {
  const e = errores[coll].find((x) => x.field === campo);
  return e ? e.message : null;
}
function generales(coll: Coleccion): string[] {
  const conocidos = new Set(['number', 'address', 'network', 'url', 'latitude', 'longitude']);
  return errores[coll].filter((x) => !x.field || !conocidos.has(x.field)).map((x) => x.message);
}

function parsearErrores(err: unknown): ErrorCampo[] {
  const data = (err as { response?: { data?: { errors?: unknown } } })?.response?.data;
  const lista = Array.isArray(data?.errors) ? (data!.errors as Record<string, unknown>[]) : [];
  const out: ErrorCampo[] = [];
  for (const e of lista) {
    const message = typeof e.message === 'string' ? e.message : '';
    if (!message) continue;
    const ext = e.extensions as { field?: unknown } | undefined;
    const field = ext && typeof ext.field === 'string' ? ext.field : undefined;
    out.push({ field, message });
  }
  return out.length > 0 ? out : [{ message: MENSAJE_TECNICO }];
}

async function cargar(coll: Coleccion): Promise<void> {
  cargando[coll] = true;
  try {
    const orden = coll === 'social_link' ? 'network' : coll === 'email' ? 'address' : coll === 'phone' ? 'display_order' : 'company_profile_id';
    const res = await api.get(`/items/${coll}`, { params: { limit: 100, sort: orden } });
    items[coll] = Array.isArray(res.data?.data) ? res.data.data : [];
  } catch {
    items[coll] = [];
  } finally {
    cargando[coll] = false;
  }
}

function reiniciarFormulario(coll: Coleccion): void {
  if (coll === 'phone') form.number = '';
  if (coll === 'email') form.address = '';
  if (coll === 'social_link') { form.network = ''; form.networkOtra = ''; form.url = ''; }
  if (coll === 'location') { form.locAddress = ''; form.latitude = null; form.longitude = null; }
}

function abrir(coll: Coleccion): void {
  errores[coll] = [];
  editando[coll] = null;
  reiniciarFormulario(coll);
  abierto[coll] = true;
}

/** Prellena el formulario con los valores actuales del registro a editar. */
function prellenar(coll: Coleccion, it: Record<string, unknown>): void {
  if (coll === 'phone') form.number = String(it.number ?? '');
  if (coll === 'email') form.address = String(it.address ?? '');
  if (coll === 'social_link') {
    const red = String(it.network ?? '');
    if (REDES.includes(red)) { form.network = red; form.networkOtra = ''; } else { form.network = '__otra__'; form.networkOtra = red; }
    form.url = String(it.url ?? '');
  }
  if (coll === 'location') {
    form.locAddress = String(it.address ?? '');
    form.latitude = Number(it.latitude);
    form.longitude = Number(it.longitude);
  }
}

function abrirEdicion(coll: Coleccion, it: Record<string, unknown>): void {
  errores[coll] = [];
  editando[coll] = idDe(coll, it);
  prellenar(coll, it);
  abierto[coll] = true;
}

function cerrar(coll: Coleccion): void {
  abierto[coll] = false;
  editando[coll] = null;
  errores[coll] = [];
  if (coll === 'social_link') redAbierta.value = false;
  reiniciarFormulario(coll);
}

/**
 * Persiste una alta (POST) o una modificación (PATCH por id → dispara el Hook de
 * update → NestJS valida → Directus escribe). Un solo Guardar; sin Guardar global.
 */
async function guardar(coll: Coleccion, payload: Record<string, unknown>): Promise<void> {
  if (enviando[coll]) return;
  enviando[coll] = true;
  errores[coll] = [];
  const id = editando[coll];
  try {
    if (id !== null) await api.patch(`/items/${coll}/${encodeURIComponent(id)}`, payload);
    else await api.post(`/items/${coll}`, payload);
    cerrar(coll);
    await cargar(coll);
  } catch (err) {
    errores[coll] = parsearErrores(err);
  } finally {
    enviando[coll] = false;
  }
}

function guardarTelefono(): void { void guardar('phone', { number: form.number }); }
function guardarCorreo(): void { void guardar('email', { address: form.address }); }
/**
 * Dropdown propio de redes (basado en click). El `<select>` nativo no fija el
 * valor dentro del formulario host de Directus; este control usa `form.network`
 * como única fuente de estado y solo eventos click, evitando el conflicto.
 */
const REDES_ITEMS = [...REDES.map((r) => ({ text: r, value: r })), { text: 'Otra', value: '__otra__' }];
const redAbierta = ref(false);
const selectRed = ref<HTMLElement | null>(null);
const etiquetaRed = computed(() => {
  if (form.network === '__otra__') return 'Otra';
  return form.network !== '' ? form.network : 'Seleccione una red social';
});
function seleccionarRed(valor: string): void {
  form.network = valor;
  if (valor !== '__otra__') form.networkOtra = '';
  redAbierta.value = false;
}
function alClicFuera(evento: MouseEvent): void {
  if (redAbierta.value && selectRed.value && !selectRed.value.contains(evento.target as Node)) {
    redAbierta.value = false;
  }
}

function guardarRed(): void {
  const network = form.network === '__otra__' ? form.networkOtra : form.network;
  void guardar('social_link', { network, url: form.url });
}
function guardarUbicacion(): void {
  void guardar('location', { address: form.locAddress, latitude: form.latitude, longitude: form.longitude });
}

function alElegirCoords(p: { latitude: number; longitude: number }): void {
  form.latitude = p.latitude;
  form.longitude = p.longitude;
}
function alUsarDireccion(v: string): void {
  form.locAddress = v;
}

// ── Eliminación directa (Directus, sin NestJS) ──────────────────────────────
function idDe(coll: Coleccion, it: Record<string, unknown>): string {
  return coll === 'location' ? String(it.company_profile_id ?? '') : String(it.id ?? '');
}
function descripcionDe(coll: Coleccion, it: Record<string, unknown>): string {
  if (coll === 'phone') return `Se eliminará el número ${it.number}.`;
  if (coll === 'email') return `Se eliminará el correo ${it.address}.`;
  if (coll === 'social_link') return `Se eliminará ${it.network}.`;
  return 'Se eliminará la ubicación registrada.';
}
function pedirEliminar(coll: Coleccion, it: Record<string, unknown>): void {
  errorEliminar.value = '';
  confirmando.value = { coll, id: idDe(coll, it), descripcion: descripcionDe(coll, it) };
}
function cancelarEliminar(): void {
  if (eliminando.value) return;
  confirmando.value = null;
  errorEliminar.value = '';
}
async function confirmarEliminar(): Promise<void> {
  if (!confirmando.value || eliminando.value) return;
  const { coll, id } = confirmando.value;
  eliminando.value = true;
  errorEliminar.value = '';
  try {
    await api.delete(`/items/${coll}/${encodeURIComponent(id)}`);
    confirmando.value = null;
    await cargar(coll);
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    errorEliminar.value = status === 403
      ? 'No tienes permiso para eliminar este dato.'
      : 'No fue posible eliminar este dato. Inténtalo nuevamente.';
  } finally {
    eliminando.value = false;
  }
}

// ── Correo receptor: carga y guardado propio ────────────────────────────────
function recipienteError(): string | null {
  const e = recipienteErrores.value.find((x) => x.field === RECIPIENT_FIELD) ?? recipienteErrores.value[0];
  return e ? e.message : null;
}
async function cargarRecipiente(): Promise<void> {
  try {
    const res = await api.get('/items/company_profile', { params: { fields: RECIPIENT_FIELD } });
    const valor = res.data?.data?.[RECIPIENT_FIELD];
    recipiente.value = typeof valor === 'string' ? valor : '';
  } catch {
    recipiente.value = '';
  } finally {
    recipienteOriginal.value = recipiente.value;
  }
}
async function guardarRecipiente(): Promise<void> {
  if (recipienteGuardando.value) return;
  recipienteGuardando.value = true;
  recipienteErrores.value = [];
  recipienteOk.value = false;
  try {
    // PATCH del singleton → Filter Hook `company_profile.items.update` → NestJS
    // valida (EmailAddress) → Directus persiste el valor canónico. Sin Guardar global.
    const res = await api.patch('/items/company_profile', { [RECIPIENT_FIELD]: recipiente.value });
    const valor = res.data?.data?.[RECIPIENT_FIELD];
    if (typeof valor === 'string') recipiente.value = valor;
    recipienteOriginal.value = recipiente.value;
    recipienteOk.value = true;
  } catch (err) {
    recipienteErrores.value = parsearErrores(err);
  } finally {
    recipienteGuardando.value = false;
  }
}

onMounted(() => {
  if (typeof document !== 'undefined') {
    document.body.classList.add(BODY_CLASS);
    document.addEventListener('mousedown', alClicFuera);
  }
  void cargarRecipiente();
});
onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.body.classList.remove(BODY_CLASS);
    document.removeEventListener('mousedown', alClicFuera);
  }
});

// Carga inicial de las cuatro listas.
void cargar('phone'); void cargar('email'); void cargar('social_link'); void cargar('location');
</script>

<template>
  <div class="cim">
    <!-- Correo receptor de solicitudes (guardado propio) -->
    <section class="cim-sec">
      <header class="cim-head"><h3>Correo receptor de solicitudes <em class="cim-req">*</em></h3></header>
      <p class="cim-note">En este correo se recibirán las solicitudes enviadas por los clientes desde el formulario de contacto del sitio web. No es tu correo de inicio de sesión ni el emisor del envío.</p>
      <form class="cim-inline" @submit.prevent="guardarRecipiente">
        <div class="cim-inline-row">
          <input v-model="recipiente" type="email" :class="{ invalid: recipienteError() }" placeholder="correo@empresa.com" aria-label="Correo receptor de solicitudes" @input="recipienteOk = false" />
          <button type="submit" class="cim-save" :disabled="recipienteGuardando || !recipienteSucio">{{ recipienteGuardando ? 'Guardando…' : 'Guardar' }}</button>
        </div>
        <small v-if="recipienteError()" class="cim-err">{{ recipienteError() }}</small>
        <small v-else-if="recipienteOk" class="cim-ok">Correo actualizado correctamente.</small>
      </form>
    </section>

    <!-- Teléfonos -->
    <section class="cim-sec">
      <header class="cim-head"><h3>Teléfonos</h3><button v-if="!abierto.phone" type="button" class="cim-add" aria-label="Agregar teléfono" @click="abrir('phone')">Agregar</button></header>
      <ul class="cim-list">
        <li v-for="(it, i) in items.phone" :key="i" class="cim-row"><span>{{ it.number }}</span><span class="cim-acciones"><button type="button" class="cim-icon cim-edit" aria-label="Editar teléfono" title="Editar teléfono" @click="abrirEdicion('phone', it)">✏️</button><button type="button" class="cim-icon cim-del" aria-label="Eliminar teléfono" title="Eliminar teléfono" @click="pedirEliminar('phone', it)">🗑</button></span></li>
        <li v-if="!cargando.phone && items.phone.length === 0" class="cim-empty">No hay teléfonos registrados.</li>
      </ul>
      <form v-if="abierto.phone" class="cim-form" @submit.prevent="guardarTelefono">
        <label class="cim-field">
          <span class="cim-label">Número de teléfono <em>*</em></span>
          <input v-model="form.number" type="text" :class="{ invalid: errorDe('phone', 'number') }" placeholder="+58 412 1234567" />
          <small class="cim-help">Debe comenzar con el código de país precedido por ‘+’, seguido del número. Ejemplo: +58 412 1234567.</small>
          <small v-if="errorDe('phone', 'number')" class="cim-err">{{ errorDe('phone', 'number') }}</small>
        </label>
        <p v-for="(m, i) in generales('phone')" :key="i" class="cim-err">{{ m }}</p>
        <div class="cim-actions"><button type="button" class="cim-ghost" @click="cerrar('phone')">Cancelar</button><button type="submit" class="cim-save" :disabled="enviando.phone">{{ enviando.phone ? 'Guardando…' : 'Guardar' }}</button></div>
      </form>
    </section>

    <!-- Correos públicos -->
    <section class="cim-sec">
      <header class="cim-head"><h3>Correos públicos</h3><button v-if="!abierto.email" type="button" class="cim-add" aria-label="Agregar correo" @click="abrir('email')">Agregar</button></header>
      <ul class="cim-list">
        <li v-for="(it, i) in items.email" :key="i" class="cim-row"><span>{{ it.address }}</span><span class="cim-acciones"><button type="button" class="cim-icon cim-edit" aria-label="Editar correo" title="Editar correo" @click="abrirEdicion('email', it)">✏️</button><button type="button" class="cim-icon cim-del" aria-label="Eliminar correo" title="Eliminar correo" @click="pedirEliminar('email', it)">🗑</button></span></li>
        <li v-if="!cargando.email && items.email.length === 0" class="cim-empty">No hay correos registrados.</li>
      </ul>
      <form v-if="abierto.email" class="cim-form" @submit.prevent="guardarCorreo">
        <label class="cim-field">
          <span class="cim-label">Correo electrónico <em>*</em></span>
          <input v-model="form.address" type="email" :class="{ invalid: errorDe('email', 'address') }" placeholder="contacto@empresa.com" />
          <small class="cim-help">Escriba una dirección de correo válida. Ejemplo: contacto@empresa.com.</small>
          <small v-if="errorDe('email', 'address')" class="cim-err">{{ errorDe('email', 'address') }}</small>
        </label>
        <p v-for="(m, i) in generales('email')" :key="i" class="cim-err">{{ m }}</p>
        <div class="cim-actions"><button type="button" class="cim-ghost" @click="cerrar('email')">Cancelar</button><button type="submit" class="cim-save" :disabled="enviando.email">{{ enviando.email ? 'Guardando…' : 'Guardar' }}</button></div>
      </form>
    </section>

    <!-- Redes sociales -->
    <section class="cim-sec">
      <header class="cim-head"><h3>Redes sociales</h3><button v-if="!abierto.social_link" type="button" class="cim-add" aria-label="Agregar red social" @click="abrir('social_link')">Agregar</button></header>
      <ul class="cim-list">
        <li v-for="(it, i) in items.social_link" :key="i" class="cim-row"><span>{{ it.network }} — {{ it.url }}</span><span class="cim-acciones"><button type="button" class="cim-icon cim-edit" aria-label="Editar red social" title="Editar red social" @click="abrirEdicion('social_link', it)">✏️</button><button type="button" class="cim-icon cim-del" aria-label="Eliminar red social" title="Eliminar red social" @click="pedirEliminar('social_link', it)">🗑</button></span></li>
        <li v-if="!cargando.social_link && items.social_link.length === 0" class="cim-empty">No hay redes registradas.</li>
      </ul>
      <form v-if="abierto.social_link" class="cim-form" @submit.prevent="guardarRed">
        <div class="cim-field">
          <span class="cim-label" id="cim-social-network-label">Red social <em>*</em></span>
          <!-- Dropdown propio basado en click: el <select> nativo no fija el valor
               dentro del formulario host de Directus. Aquí `form.network` es la única
               fuente de estado y se actualiza con eventos click (no `change`). -->
          <div ref="selectRed" class="cim-select" :class="{ invalid: errorDe('social_link', 'network'), abierto: redAbierta }">
            <button type="button" class="cim-select-trigger" :class="{ placeholder: form.network === '' }" aria-haspopup="listbox" :aria-expanded="redAbierta" aria-labelledby="cim-social-network-label" @click="redAbierta = !redAbierta">
              <span>{{ etiquetaRed }}</span><span class="cim-select-caret" aria-hidden="true">▾</span>
            </button>
            <ul v-if="redAbierta" class="cim-select-list" role="listbox" aria-labelledby="cim-social-network-label">
              <li v-for="opt in REDES_ITEMS" :key="opt.value" role="option" :aria-selected="form.network === opt.value">
                <button type="button" class="cim-select-opt" :class="{ activa: form.network === opt.value }" @click="seleccionarRed(opt.value)">{{ opt.text }}</button>
              </li>
            </ul>
          </div>
          <label v-if="form.network === '__otra__'" class="cim-subfield" for="cim-social-network-other">
            <span class="cim-label">Nombre de la red social o canal <em>*</em></span>
            <input id="cim-social-network-other" v-model="form.networkOtra" type="text" class="cim-otra" placeholder="Behance" />
          </label>
          <small class="cim-help">Seleccione la red o canal. Si no aparece, elija “Otra” y escriba su nombre.</small>
          <small v-if="errorDe('social_link', 'network')" class="cim-err">{{ errorDe('social_link', 'network') }}</small>
        </div>
        <label class="cim-field">
          <span class="cim-label">URL <em>*</em></span>
          <input v-model="form.url" type="text" :class="{ invalid: errorDe('social_link', 'url') }" placeholder="https://instagram.com/cromaticacreativa" />
          <small class="cim-help">Escriba la URL completa comenzando con http:// o https://.</small>
          <small v-if="errorDe('social_link', 'url')" class="cim-err">{{ errorDe('social_link', 'url') }}</small>
        </label>
        <p v-for="(m, i) in generales('social_link')" :key="i" class="cim-err">{{ m }}</p>
        <div class="cim-actions"><button type="button" class="cim-ghost" @click="cerrar('social_link')">Cancelar</button><button type="submit" class="cim-save" :disabled="enviando.social_link">{{ enviando.social_link ? 'Guardando…' : 'Guardar' }}</button></div>
      </form>
    </section>

    <!-- Ubicación -->
    <section class="cim-sec">
      <header class="cim-head"><h3>Ubicación</h3><button v-if="!abierto.location && items.location.length === 0" type="button" class="cim-add" aria-label="Agregar ubicación" @click="abrir('location')">Agregar</button></header>
      <ul class="cim-list">
        <li v-for="(it, i) in items.location" :key="i" class="cim-row"><span>{{ it.address }} — {{ it.latitude }}, {{ it.longitude }}</span><span class="cim-acciones"><button type="button" class="cim-icon cim-edit" aria-label="Editar ubicación" title="Editar ubicación" @click="abrirEdicion('location', it)">✏️</button><button type="button" class="cim-icon cim-del" aria-label="Eliminar ubicación" title="Eliminar ubicación" @click="pedirEliminar('location', it)">🗑</button></span></li>
        <li v-if="!cargando.location && items.location.length === 0" class="cim-empty">Sin ubicación registrada.</li>
      </ul>
      <form v-if="abierto.location" class="cim-form" @submit.prevent="guardarUbicacion">
        <OsmLocationPicker :key="editando.location ?? 'nuevo'" :initial-lat="form.latitude" :initial-lng="form.longitude" @coords="alElegirCoords" @use-address="alUsarDireccion" />
        <div class="cim-coords">
          <label class="cim-field"><span class="cim-label">Latitud <em>*</em></span><input :value="form.latitude ?? ''" type="text" readonly :class="{ invalid: errorDe('location', 'latitude') }" placeholder="Elija un punto en el mapa" /><small v-if="errorDe('location', 'latitude')" class="cim-err">{{ errorDe('location', 'latitude') }}</small></label>
          <label class="cim-field"><span class="cim-label">Longitud <em>*</em></span><input :value="form.longitude ?? ''" type="text" readonly :class="{ invalid: errorDe('location', 'longitude') }" placeholder="Elija un punto en el mapa" /><small v-if="errorDe('location', 'longitude')" class="cim-err">{{ errorDe('location', 'longitude') }}</small></label>
        </div>
        <label class="cim-field">
          <span class="cim-label">Dirección <em>*</em></span>
          <textarea v-model="form.locAddress" rows="2" :class="{ invalid: errorDe('location', 'address') }" placeholder="Av. Principal, Edificio X, Piso 2, Caracas, Venezuela"></textarea>
          <small class="cim-help">Escriba una dirección pública completa (mínimo 10 caracteres). No la completa el mapa.</small>
          <small v-if="errorDe('location', 'address')" class="cim-err">{{ errorDe('location', 'address') }}</small>
        </label>
        <p v-for="(m, i) in generales('location')" :key="i" class="cim-err">{{ m }}</p>
        <div class="cim-actions"><button type="button" class="cim-ghost" @click="cerrar('location')">Cancelar</button><button type="submit" class="cim-save" :disabled="enviando.location">{{ enviando.location ? 'Guardando…' : 'Guardar' }}</button></div>
      </form>
    </section>

    <!-- Confirmación de eliminación -->
    <div v-if="confirmando" class="cim-modal" role="dialog" aria-modal="true" aria-labelledby="cim-modal-titulo">
      <div class="cim-card">
        <h4 id="cim-modal-titulo">¿Seguro que deseas eliminar este dato?</h4>
        <p>{{ confirmando.descripcion }}</p>
        <p v-if="errorEliminar" class="cim-err">{{ errorEliminar }}</p>
        <div class="cim-actions">
          <button type="button" class="cim-ghost" :disabled="eliminando" @click="cancelarEliminar">Cancelar</button>
          <button type="button" class="cim-danger" :disabled="eliminando" @click="confirmarEliminar">{{ eliminando ? 'Eliminando…' : 'Eliminar' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cim { display: flex; flex-direction: column; gap: 20px; width: 100%; max-width: 100%; }
.cim-sec { border: 1px solid var(--theme--border-color, #cfd4dc); border-radius: var(--theme--border-radius, 6px); padding: 12px 14px; }
.cim-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.cim-head h3 { margin: 0; font-size: 1.05em; color: var(--theme--foreground-accent, #172940); }
.cim-list { list-style: none; margin: 8px 0 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.cim-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 8px; border-radius: 4px; background: var(--theme--background-subdued, #f7f8fa); color: var(--theme--foreground, #172940); }
.cim-row span { word-break: break-word; }
.cim-acciones { flex: 0 0 auto; display: flex; gap: 6px; }
.cim-icon { flex: 0 0 auto; border: none; background: transparent; cursor: pointer; font-size: 1.3em; line-height: 1; padding: 8px; border-radius: 6px; min-width: 40px; min-height: 40px; display: inline-flex; align-items: center; justify-content: center; color: var(--theme--foreground-subdued, #7b7690); }
.cim-icon:focus-visible { outline: 2px solid var(--theme--primary, #7c3aed); outline-offset: 1px; }
.cim-edit:hover, .cim-edit:focus-visible { background: var(--theme--background-accent, #f0f4f9); color: var(--theme--foreground, #172940); }
.cim-del:hover, .cim-del:focus-visible { background: var(--theme--danger-background, #fce4e8); color: var(--theme--danger, #e35169); }
.cim-empty { color: var(--theme--foreground-subdued, #7b7690); }
.cim-form { margin-top: 12px; display: flex; flex-direction: column; gap: 12px; border: 1px solid var(--theme--border-color-subdued, #e1e4e9); border-radius: var(--theme--border-radius, 6px); padding: 12px; background: var(--theme--background-subdued, #f7f8fa); }
.cim-field { display: flex; flex-direction: column; gap: 4px; }
.cim-subfield { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
.cim-label { font-weight: 600; color: var(--theme--foreground, #172940); }
.cim-label em { color: var(--theme--primary, #7c3aed); font-style: normal; }
.cim-field input, .cim-field select, .cim-field textarea, .cim-otra {
  width: 100%; box-sizing: border-box; padding: 8px 12px; font: inherit;
  border: 2px solid var(--theme--form--field--input--border-color, #d3dae4);
  border-radius: var(--theme--border-radius, 6px);
  background: var(--theme--form--field--input--background, #fff); color: var(--theme--foreground, #172940);
}
.cim-field input:focus, .cim-field select:focus, .cim-field textarea:focus { outline: none; border-color: var(--theme--primary, #7c3aed); }
.cim-field .invalid { border-color: var(--theme--danger, #e35169); }
.cim-select { position: relative; width: 100%; }
.cim-select-trigger { width: 100%; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 12px; font: inherit; text-align: left; cursor: pointer; border: 2px solid var(--theme--form--field--input--border-color, #d3dae4); border-radius: var(--theme--border-radius, 6px); background: var(--theme--form--field--input--background, #fff); color: var(--theme--foreground, #172940); }
.cim-select-trigger:focus-visible { outline: none; border-color: var(--theme--primary, #7c3aed); }
.cim-select.invalid .cim-select-trigger { border-color: var(--theme--danger, #e35169); }
.cim-select-trigger.placeholder { color: var(--theme--foreground-subdued, #7b7690); }
.cim-select-caret { flex: 0 0 auto; }
.cim-select-list { position: absolute; z-index: 20; top: calc(100% + 4px); left: 0; right: 0; margin: 0; padding: 4px; list-style: none; max-height: 260px; overflow-y: auto; background: var(--theme--background, #fff); border: 1px solid var(--theme--border-color, #cfd4dc); border-radius: var(--theme--border-radius, 6px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14); }
.cim-select-opt { display: block; width: 100%; text-align: left; padding: 8px 10px; border: none; border-radius: 4px; background: transparent; color: var(--theme--foreground, #172940); font: inherit; cursor: pointer; min-height: 40px; }
.cim-select-opt:hover, .cim-select-opt:focus-visible { background: var(--theme--background-accent, #f0f4f9); outline: none; }
.cim-select-opt.activa { background: var(--theme--primary-background, #f1ebfc); color: var(--theme--primary, #7c3aed); font-weight: 600; }
.cim-help { color: var(--theme--foreground-subdued, #7b7690); font-size: 0.85em; }
.cim-note { margin: 8px 0 0; color: var(--theme--foreground-subdued, #7b7690); font-size: 0.9em; }
.cim-req { color: var(--theme--primary, #7c3aed); font-style: normal; }
.cim-inline { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
.cim-inline-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: stretch; }
.cim-inline-row input { flex: 1 1 240px; min-width: 0; box-sizing: border-box; padding: 8px 12px; font: inherit; border: 2px solid var(--theme--form--field--input--border-color, #d3dae4); border-radius: var(--theme--border-radius, 6px); background: var(--theme--form--field--input--background, #fff); color: var(--theme--foreground, #172940); }
.cim-inline-row input:focus { outline: none; border-color: var(--theme--primary, #7c3aed); }
.cim-inline-row input.invalid { border-color: var(--theme--danger, #e35169); }
@media (max-width: 599px) { .cim-inline-row { flex-direction: column; } .cim-inline-row .cim-save { width: 100%; } }
.cim-err { color: var(--theme--danger, #e35169); font-size: 0.85em; }
.cim-ok { color: var(--theme--success, #2ecda7); font-size: 0.85em; }
.cim-actions { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }
.cim-add, .cim-save, .cim-ghost, .cim-danger { padding: 8px 16px; border: none; border-radius: var(--theme--border-radius, 6px); font: inherit; cursor: pointer; white-space: nowrap; }
.cim-add, .cim-save { background: var(--theme--primary, #7c3aed); color: var(--theme--primary--foreground, #fff); }
.cim-add:disabled, .cim-save:disabled, .cim-danger:disabled { opacity: 0.6; cursor: default; }
.cim-ghost { background: transparent; color: var(--theme--foreground, #172940); border: 1px solid var(--theme--border-color, #d3dae4); }
.cim-danger { background: var(--theme--danger, #e35169); color: #fff; }
.cim-coords { display: flex; gap: 12px; flex-wrap: wrap; }
.cim-coords .cim-field { flex: 1 1 160px; }
.cim-modal { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(23, 41, 64, 0.45); }
.cim-card { width: 100%; max-width: 420px; background: var(--theme--background, #fff); color: var(--theme--foreground, #172940); border-radius: var(--theme--border-radius, 6px); padding: 20px; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2); display: flex; flex-direction: column; gap: 10px; }
.cim-card h4 { margin: 0; font-size: 1.1em; color: var(--theme--foreground-accent, #172940); }
.cim-card p { margin: 0; word-break: break-word; }
@media (max-width: 599px) { .cim-actions { justify-content: stretch; } .cim-actions button { flex: 1 1 auto; } }
</style>
