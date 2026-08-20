/**
 * Extensión de Directus del módulo CompanyProfile.
 *
 * Filter Hook bloqueante que delega las mutaciones administrativas de
 * CompanyProfile en el backend interno de NestJS. Directus sigue siendo el ÚNICO
 * escritor final: NestJS valida, normaliza, aprueba o rechaza y devuelve un
 * payload canónico; Directus persiste ese payload aprobado.
 *
 * Alcance implementado actualmente (solo creaciones):
 * - Agregar información de contacto (HU22): `phone`, `email`, `social_link`.
 * - Agregar ubicación (HU24): `location`.
 * Esta extensión es permanente para CompanyProfile y crece de forma incremental
 * (modificación y eliminación quedan pendientes), sin crear una extensión por
 * Historia de Usuario. Las rutas y operaciones son explícitas, no un validador
 * genérico.
 *
 * Diseño "fail closed": si falta configuración, el backend no responde, agota el
 * tiempo de espera, devuelve un estado no exitoso o una respuesta inesperada, el
 * Hook lanza un error y Directus NO persiste.
 *
 * Errores estructurados: en un rechazo de negocio esperado (400/409/422) el Hook
 * relanza el/los error(es) del backend como DirectusError(s) — con `status` y
 * `code` propios y `extensions.field` — de modo que Directus responde con ese
 * status (no [INTERNAL_SERVER_ERROR]) y, cuando su interfaz lo permite, asocia
 * cada mensaje al campo. Si el backend devuelve varios `errors[]` de la misma
 * operación, se lanzan como un arreglo y Directus los surface juntos. En un error
 * técnico (401/403/404/405/429/5xx/timeout/red) se muestra un mensaje genérico.
 * Nunca se exponen secretos, SQL, stack traces ni detalles internos.
 */

const CONTACT_INFORMATION_COLLECTIONS = ['phone', 'email', 'social_link'];
const CONTACT_INFORMATION_PATH = '/internal/cms/company-profile/contact-information';
const LOCATION_COLLECTION = 'location';
const LOCATION_PATH = '/internal/cms/company-profile/location';
// Correo receptor de solicitudes: única parte del update del singleton que se
// valida (HU23 mínima). Otros campos del singleton no se interceptan.
const SINGLETON_COLLECTION = 'company_profile';
const RECIPIENT_FIELD = 'contact_request_recipient_email';
const RECIPIENT_PATH = '/internal/cms/company-profile/contact-request-recipient-email';
const DEFAULT_TIMEOUT_MS = 5000;
const MENSAJE_TECNICO_GENERICO = 'No fue posible procesar la solicitud en este momento.';
// Solo estos status HTTP de negocio pueden propagar el mensaje del backend al
// Administrador. Cualquier otro (401/403/404/405/429/5xx, etc.) muestra un
// mensaje genérico para no filtrar detalles internos.
const ESTADOS_NEGOCIO = new Set([400, 409, 422]);
// Código de error de Directus por status de negocio. `FAILED_VALIDATION` y
// `RECORD_NOT_UNIQUE` son los que la interfaz de Directus asocia a un campo
// mediante `extensions.field`; `INVALID_PAYLOAD` cubre el resto de 400.
const CODIGO_POR_STATUS = { 400: 'INVALID_PAYLOAD', 409: 'RECORD_NOT_UNIQUE', 422: 'FAILED_VALIDATION' };

/**
 * Error con forma de DirectusError (`name === 'DirectusError'`, `code`, `status`,
 * `extensions`). El manejador de errores de Directus lo reconoce como error
 * conocido (`isDirectusError`) y responde con ese `status`/`code` en lugar de
 * envolverlo como INTERNAL_SERVER_ERROR. No se importa `@directus/errors` para
 * mantener el Hook como ESM plano sin dependencias de build.
 */
class ErrorDirectus extends Error {
  constructor(code, message, status, extensions) {
    super(message);
    this.name = 'DirectusError';
    this.code = code;
    this.status = status;
    this.extensions = extensions ?? {};
  }
}

export default ({ filter }, { logger, env }) => {
  for (const coleccion of CONTACT_INFORMATION_COLLECTIONS) {
    filter(`${coleccion}.items.create`, async (payload) => delegarCreacion(CONTACT_INFORMATION_PATH, coleccion, payload, { logger, env }));
  }
  filter(`${LOCATION_COLLECTION}.items.create`, async (payload) => delegarCreacion(LOCATION_PATH, LOCATION_COLLECTION, payload, { logger, env }));
  // Update del singleton: solo se valida si cambia el correo receptor.
  filter(`${SINGLETON_COLLECTION}.items.update`, async (payload) => delegarCorreoReceptor(payload, { logger, env }));
};

/**
 * Envía una operación al backend interno y devuelve el `payload` canónico
 * aprobado, o lanza: DirectusError(s) de negocio (400/409/422) o un error técnico
 * genérico (resto). No decide la fusión: eso lo hace cada llamador.
 */
async function pedirBackend(ruta, coleccion, cuerpoEnviar, { logger, env }) {
  const baseUrl = leerObligatoria(env, 'BACKEND_INTERNAL_URL');
  const token = leerObligatoria(env, 'BACKEND_INTERNAL_TOKEN');
  const timeoutMs = leerTimeout(env);

  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), timeoutMs);

  let respuesta;
  try {
    respuesta = await fetch(`${sinBarraFinal(baseUrl)}${ruta}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(cuerpoEnviar),
      signal: controlador.signal,
    });
  } catch {
    logger?.warn?.(`CompanyProfile: el backend interno no respondió para '${coleccion}'. Operación cancelada.`);
    throw errorTecnico();
  } finally {
    clearTimeout(temporizador);
  }

  if (!respuesta.ok) {
    logger?.warn?.(`CompanyProfile: el backend interno rechazó la operación en '${coleccion}' (HTTP ${respuesta.status}).`);
    // Un status técnico (fuera de la allowlist) no lee el cuerpo: mensaje genérico.
    if (!ESTADOS_NEGOCIO.has(respuesta.status)) throw errorTecnico();
    const cuerpo = await leerJson(respuesta);
    const errores = construirErroresNegocio(respuesta.status, cuerpo, coleccion);
    // Un solo error se lanza directo; varios se lanzan como arreglo para que
    // Directus los devuelva juntos (su manejador de errores acepta arreglos).
    throw errores.length === 1 ? errores[0] : errores;
  }

  const cuerpo = await leerJson(respuesta);
  if (!cuerpo || typeof cuerpo.payload !== 'object' || cuerpo.payload === null) {
    logger?.warn?.(`CompanyProfile: respuesta inesperada del backend interno para '${coleccion}'.`);
    throw errorTecnico();
  }
  return cuerpo.payload;
}

async function delegarCreacion(ruta, coleccion, payload, ctx) {
  const canonico = await pedirBackend(ruta, coleccion, { collection: coleccion, payload }, ctx);
  // Escritor único: Directus persiste exactamente el payload canónico aprobado.
  // Solo se preservan campos técnicos imprescindibles del payload original
  // (allowlist); los valores de negocio, `company_profile_id` y `display_order`
  // provienen siempre del backend. Campos desconocidos no sobreviven.
  return fusionarConCanonico(payload, canonico);
}

/**
 * Update del singleton: solo valida el correo receptor y solo cuando el update lo
 * incluye. Preserva el resto del payload del update (a diferencia del create, que
 * usa allowlist estricta). Si el update no toca el correo receptor, no contacta al
 * backend y deja pasar la operación.
 */
async function delegarCorreoReceptor(payload, ctx) {
  if (!payload || typeof payload !== 'object' || !Object.prototype.hasOwnProperty.call(payload, RECIPIENT_FIELD)) {
    return payload;
  }
  const canonico = await pedirBackend(
    RECIPIENT_PATH,
    SINGLETON_COLLECTION,
    { collection: SINGLETON_COLLECTION, payload: { [RECIPIENT_FIELD]: payload[RECIPIENT_FIELD] } },
    ctx,
  );
  const valor = canonico[RECIPIENT_FIELD];
  return { ...payload, [RECIPIENT_FIELD]: typeof valor === 'string' ? valor : payload[RECIPIENT_FIELD] };
}

/**
 * Construye los DirectusError(s) de un rechazo de negocio. Si el backend devuelve
 * `errors[]` (por campo), produce uno por error preservando `field` y `message`;
 * si no, produce uno solo con el `message` general normalizado.
 */
function construirErroresNegocio(status, cuerpo, coleccion) {
  const code = CODIGO_POR_STATUS[status] ?? 'FAILED_VALIDATION';
  const lista = Array.isArray(cuerpo?.errors) ? cuerpo.errors : [];
  const porCampo = lista
    .map((entrada) => normalizarErrorCampo(entrada))
    .filter((entrada) => entrada !== null);
  if (porCampo.length === 0) {
    const mensaje = normalizarMensaje(cuerpo) ?? 'La solicitud fue rechazada por el backend interno.';
    return [crearErrorNegocio(code, mensaje, status, coleccion, undefined)];
  }
  return porCampo.map((entrada) => crearErrorNegocio(code, entrada.message, status, coleccion, entrada.field));
}

function normalizarErrorCampo(entrada) {
  if (!entrada || typeof entrada !== 'object') return null;
  const message = typeof entrada.message === 'string' ? entrada.message.trim() : '';
  if (!message) return null;
  const field = typeof entrada.field === 'string' && entrada.field.trim().length > 0 ? entrada.field.trim() : undefined;
  return { field, message };
}

function crearErrorNegocio(code, message, status, coleccion, field) {
  const extensions = { collection: coleccion };
  if (field) extensions.field = field;
  return new ErrorDirectus(code, message, status, extensions);
}

function errorTecnico() {
  // 503 con mensaje genérico: no filtra el status ni el detalle interno real.
  return new ErrorDirectus('SERVICE_UNAVAILABLE', MENSAJE_TECNICO_GENERICO, 503, {});
}

function normalizarMensaje(cuerpo) {
  const mensaje = cuerpo && typeof cuerpo === 'object' ? cuerpo.message : undefined;
  if (typeof mensaje === 'string') {
    const texto = mensaje.trim();
    return texto.length > 0 ? texto : null;
  }
  if (Array.isArray(mensaje)) {
    const texto = mensaje.filter((valor) => typeof valor === 'string' && valor.trim().length > 0).join(' ').trim();
    return texto.length > 0 ? texto : null;
  }
  return null;
}

function fusionarConCanonico(payload, canonico) {
  const resultado = { ...canonico };
  if (payload && typeof payload.id === 'string' && payload.id.length > 0) {
    resultado.id = payload.id;
  }
  return resultado;
}

/**
 * Lee una variable de configuración desde el `env` del contexto del Hook
 * (`@directus/env`, que sí incluye las variables custom del `.env`) y, como
 * respaldo, desde `process.env`. Directus 12.3.0 NO copia las variables custom
 * del `.env` a `process.env`, por lo que leer solo de `process.env` fallaba.
 */
function valorEnv(env, nombre) {
  const bruto = env && env[nombre] !== undefined ? env[nombre] : process.env[nombre];
  if (bruto === undefined || bruto === null) return undefined;
  const texto = String(bruto).trim();
  return texto.length > 0 ? texto : undefined;
}

function leerObligatoria(env, nombre) {
  const valor = valorEnv(env, nombre);
  if (!valor) {
    throw new Error(`CompanyProfile: falta la variable de entorno '${nombre}'. La creación se cancela (fail closed).`);
  }
  return valor;
}

function leerTimeout(env) {
  const crudo = valorEnv(env, 'BACKEND_INTERNAL_TIMEOUT_MS');
  if (!crudo) return DEFAULT_TIMEOUT_MS;
  const valor = Number(crudo);
  return Number.isFinite(valor) && valor > 0 ? valor : DEFAULT_TIMEOUT_MS;
}

async function leerJson(respuesta) {
  try {
    return await respuesta.json();
  } catch {
    return undefined;
  }
}

function sinBarraFinal(url) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}
