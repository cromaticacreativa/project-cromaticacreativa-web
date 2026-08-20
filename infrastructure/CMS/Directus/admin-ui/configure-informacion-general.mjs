/**
 * "Información General" — configuración administrativa nativa de Directus 12.3.0
 * para HU22 (información de contacto) y HU24 (ubicación).
 *
 * Aplica SOLO metadata de Directus (colecciones/campos: nombres en español,
 * relaciones O2M virtuales, navegación, campos técnicos ocultos, ayudas). NO
 * crea tablas ni columnas, NO cambia el modelo SQL propiedad de TypeORM y NO
 * escribe en las tablas de negocio. Es idempotente y reproducible.
 *
 * Mecanismo de mutación (sin cambios): al crear un `phone`/`email`/`social_link`/
 * `location` desde esta UI, Directus dispara el Filter Hook `company-profile`,
 * que llama a NestJS (server-side, con `CMS_INTERNAL_TOKEN`), valida en
 * Domain/Application y devuelve el payload canónico; Directus es el único escritor
 * final. El token NUNCA llega al navegador.
 *
 * Requisitos: Directus en ejecución + un Static Access Token con permisos de
 * configuración (`DIRECTUS_CONFIG_TOKEN`) y DIRECTUS_URL/PUBLIC_URL en el
 * entorno o en el `.env` del CMS. Node 22.
 *
 * Uso (desde infrastructure/CMS/Directus):  npm run configure:ui
 *
 * NOTA: el rol "Editor de contenido" (solo crear/leer, sin editar/eliminar, para
 * respetar que HU23/HU25 y la eliminación NO están implementadas) y la creación
 * del registro singleton `company_profile` se documentan como pasos operativos en
 * el README; no se automatizan aquí para no asumir un correo destinatario ni
 * tocar el modelo de permisos sin verificación.
 */

import { readFile } from 'node:fs/promises';

const FOLDER_ANTERIOR = 'informacion_general';

/** Traducciones de nombre de colección (es-ES + es-419). */
const t = (nombre) => [
  { language: 'es-ES', translation: nombre, singular: nombre, plural: nombre },
  { language: 'es-419', translation: nombre, singular: nombre, plural: nombre },
];

/** Metadata de colecciones (solo `meta`, nunca schema). */
const COLECCIONES = {
  phone: { icon: 'call', hidden: true, group: null, sort: 1, translations: t('Teléfonos'), note: 'Teléfonos públicos de la empresa (incluye WhatsApp como red social, no aquí).' },
  email: { icon: 'mail', hidden: true, group: null, sort: 2, translations: t('Correos públicos'), note: 'Correos electrónicos públicos de la empresa.' },
  social_link: { icon: 'share', hidden: true, group: null, sort: 3, translations: t('Redes sociales'), note: 'Redes sociales y canales (incluye WhatsApp).' },
  location: { icon: 'place', hidden: true, group: null, sort: 4, translations: t('Ubicación'), note: 'Ubicación de la empresa (una sola).' },
};

/**
 * Relaciones virtuales mostradas en el formulario singleton. `field` es alias:
 * `schema: null` evita crear columnas físicas. La FK real permanece en el child.
 */
const RELACIONES = [
  {
    alias: 'phones', manyCollection: 'phone', manyField: 'company_profile_id',
    label: 'Teléfonos', template: '{{number}}', fields: ['number'],
    note: 'Teléfonos públicos registrados. Use “Crear nuevo” para agregar un teléfono.',
  },
  {
    alias: 'emails', manyCollection: 'email', manyField: 'company_profile_id',
    label: 'Correos públicos', template: '{{address}}', fields: ['address'],
    note: 'Correos públicos registrados. Use “Crear nuevo” para agregar un correo.',
  },
  {
    alias: 'social_links', manyCollection: 'social_link', manyField: 'company_profile_id',
    label: 'Redes sociales', template: '{{network}} — {{url}}', fields: ['network', 'url'],
    note: 'Redes sociales y canales registrados; WhatsApp se gestiona como red social.',
  },
  {
    alias: 'location', manyCollection: 'location', manyField: 'company_profile_id',
    label: 'Ubicación', template: '{{address}} — {{latitude}}, {{longitude}}', fields: ['address', 'latitude', 'longitude'],
    note: 'Si la lista está vacía, no se ha registrado una ubicación. Solo puede existir una.',
  },
];

/** Campos técnicos que se ocultan de la experiencia del administrador. */
const TECNICOS = ['id', 'company_profile_id', 'singleton_key', 'display_order'];

/** Metadata amigable de los campos de negocio (label vía translations, ayuda, placeholder). */
const label = (nombre) => [
  { language: 'es-ES', translation: nombre },
  { language: 'es-419', translation: nombre },
];

/**
 * Redes sociales frecuentes como opciones nativas del select. Es solo UX: el
 * Domain NO se cierra (SocialLink sigue aceptando cualquier red). `allowOther`
 * habilita la opción nativa "Otra" para escribir una red no listada, cuyo texto
 * es exactamente el valor que se envía a `network` (nunca se guarda "Otra"). Por
 * eso NO se incluye una opción con valor "Otra".
 */
const REDES_SOCIALES = [
  'Instagram', 'Facebook', 'WhatsApp', 'LinkedIn', 'TikTok', 'YouTube', 'X (Twitter)', 'Pinterest', 'Telegram',
].map((nombre) => ({ text: nombre, value: nombre }));

const CAMPOS = {
  phone: {
    number: { interface: 'input', translations: label('Número de teléfono'), note: "Debe comenzar con el código de país precedido por '+', seguido del número de teléfono. Ejemplo: +58 412 1234567.", options: { placeholder: '+58 412 1234567', iconLeft: 'call' }, required: true, width: 'full' },
  },
  email: {
    address: { interface: 'input', translations: label('Correo electrónico'), note: 'Escriba una dirección de correo válida. Ejemplo: contacto@empresa.com.', options: { placeholder: 'contacto@empresa.com', iconLeft: 'mail' }, required: true, width: 'full' },
  },
  social_link: {
    network: { interface: 'select-dropdown', translations: label('Red social'), note: "Seleccione la red social o canal. Si no aparece en la lista, use la opción 'Otra' y escriba su nombre.", options: { choices: REDES_SOCIALES, allowOther: true, allowNone: false, placeholder: 'Seleccione una red social' }, required: true, width: 'half' },
    url: { interface: 'input', translations: label('URL'), note: 'Escriba la URL completa del perfil o canal comenzando con http:// o https://.', options: { placeholder: 'https://instagram.com/cromaticacreativa', iconLeft: 'link' }, required: true, width: 'half' },
  },
  location: {
    // Latitud/Longitud las completa el mapa (readonly, solo UX): el backend sigue
    // validando el rango. La Dirección es manual. El mapa va primero (sort 1).
    latitude: { interface: 'input', translations: label('Latitud'), note: 'Se completa automáticamente al elegir un punto en el mapa. Debe estar entre -90 y 90.', options: { placeholder: '10.4806' }, required: true, readonly: true, width: 'half', sort: 2 },
    longitude: { interface: 'input', translations: label('Longitud'), note: 'Se completa automáticamente al elegir un punto en el mapa. Debe estar entre -180 y 180.', options: { placeholder: '-66.9036' }, required: true, readonly: true, width: 'half', sort: 3 },
    address: { interface: 'input-multiline', translations: label('Dirección'), note: 'Escriba la dirección pública que se mostrará. No la completa el mapa. Ejemplo: Av. Principal, Edificio X, Piso 2, Caracas, Venezuela.', options: { placeholder: 'Av. Principal, Edificio X, Piso 2, Caracas, Venezuela' }, required: true, width: 'full', sort: 4 },
  },
};

/**
 * Campo de presentación (alias, no persiste) que hospeda la Custom Interface
 * `company-info-manager`. Reemplaza a los alias O2M para la creación de children:
 * cada "Crear nuevo" hace un create TOP-LEVEL (Items API) que persiste de
 * inmediato y dispara el Filter Hook, con errores inline del backend. No agrega
 * columna (schema: null).
 */
const CAMPO_MANAGER = {
  field: 'informacion_general',
  type: 'alias',
  meta: {
    interface: 'company-info-manager',
    special: ['alias', 'no-data'],
    translations: label('Teléfonos, correos, redes y ubicación'),
    note: 'Cada dato se guarda de forma independiente al pulsar Guardar; no es necesario usar el botón Guardar general.',
    hidden: false,
    readonly: false,
    required: false,
    width: 'full',
    sort: 2,
  },
};

/** Campos de negocio del singleton `company_profile` con etiqueta amigable. */
const CAMPOS_COMPANY_PROFILE = {
  contact_request_recipient_email: {
    // Oculto en el formulario nativo: ahora se edita y guarda desde el gestor
    // (company-info-manager) con su propio botón "Guardar correo", que valida vía
    // el Filter Hook `company_profile.items.update`. Así no depende del Guardar global.
    interface: 'input',
    translations: label('Correo receptor de solicitudes'),
    note: 'En este correo se recibirán las solicitudes enviadas por los clientes desde el formulario de contacto del sitio web.',
    options: { placeholder: 'correo@empresa.com', iconLeft: 'mark_email_read' },
    hidden: true,
    required: true,
    width: 'full',
    sort: 1,
  },
};

/** IDs que Directus debe autogenerar (UUID) al crear (top-level create → dispara el Hook). */
const UUID_IDS = { phone: 'id', email: 'id', social_link: 'id' };

async function cargarEnv() {
  const env = { ...process.env };
  try {
    const contenido = await readFile(new URL('../.env', import.meta.url), 'utf8');
    for (const linea of contenido.split(/\r?\n/)) {
      const l = linea.trim();
      if (!l || l.startsWith('#') || !l.includes('=')) continue;
      const i = l.indexOf('=');
      const k = l.slice(0, i).trim();
      if (env[k] === undefined) env[k] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    }
  } catch { /* solo process.env */ }
  return env;
}

async function api(base, token, path, opciones = {}) {
  let r;
  try {
    r = await fetch(`${base}${path}`, {
      ...opciones,
      headers: { 'content-type': 'application/json', ...(opciones.headers ?? {}), authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error('Directus no está disponible.');
  }
  if (r.status === 401) throw new Error('DIRECTUS_CONFIG_TOKEN no es válido.');
  if (r.status === 403) throw new Error('DIRECTUS_CONFIG_TOKEN no tiene permisos suficientes.');
  if (r.status === 204) return null;
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(`HTTP ${r.status} ${path}: ${JSON.stringify(j?.errors ?? j)?.slice(0, 300)}`);
  return j;
}

async function configurarAliasRelacional(base, token, relacion) {
  const meta = {
    special: ['o2m'],
    interface: 'list-o2m',
    options: {
      layout: 'list',
      template: relacion.template,
      fields: relacion.fields,
      enableCreate: true,
      enableSelect: false,
      enableSearchFilter: false,
      enableLink: false,
      limit: 15,
    },
    display: 'related-values',
    display_options: { template: relacion.template },
    translations: label(relacion.label),
    note: relacion.note,
    // Ocultos: el gestor (company-info-manager) reemplaza estos alias O2M para la
    // creación de children. El O2M nativo hacía creates anidados/staged que solo
    // persistían con el "Guardar" global; por eso se ocultan de la pantalla.
    hidden: true,
    readonly: false,
    required: false,
    width: 'full',
    sort: RELACIONES.indexOf(relacion) + 10,
  };

  const existente = await api(base, token, `/fields/company_profile/${relacion.alias}`).catch(() => null);
  if (existente?.data) {
    await api(base, token, `/fields/company_profile/${relacion.alias}`, {
      method: 'PATCH', body: JSON.stringify({ meta }),
    });
  } else {
    await api(base, token, '/fields/company_profile', {
      method: 'POST',
      body: JSON.stringify({ field: relacion.alias, type: 'alias', schema: null, meta }),
    });
  }

  const fisica = await api(base, token, `/relations/${relacion.manyCollection}/${relacion.manyField}`);
  const metaActual = fisica?.data?.meta;
  if (metaActual?.one_field !== relacion.alias || metaActual?.one_deselect_action !== 'nullify') {
    await api(base, token, `/relations/${relacion.manyCollection}/${relacion.manyField}`, {
      method: 'PATCH',
      body: JSON.stringify({
        collection: relacion.manyCollection,
        field: relacion.manyField,
        related_collection: 'company_profile',
        schema: { on_delete: 'CASCADE', on_update: 'RESTRICT' },
        meta: { one_field: relacion.alias, one_deselect_action: 'nullify' },
      }),
    });
  }

  console.log(`• Relación configurada: company_profile.${relacion.alias} → ${relacion.manyCollection}.${relacion.manyField}`);
}

/**
 * Crea o actualiza (idempotente) el campo de presentación `location.mapa` que
 * hospeda la Custom Interface del mapa. Es un alias (`schema: null`): no toca el
 * schema SQL ni agrega columnas. Si la extensión no está compilada/cargada,
 * Directus mostrará el campo sin interfaz, pero la metadata queda aplicada.
 */
/**
 * Retira (idempotente) el campo alias `location.mapa` de la extensión retirada
 * `osm-location-picker`. El mapa ahora vive dentro del gestor
 * (company-info-manager). Al ser alias (`schema: null`), borrarlo es solo
 * metadata: NO implica migración SQL. Si no existe, no hace nada.
 */
async function retirarCampoMapa(base, token) {
  const existente = await api(base, token, '/fields/location/mapa').catch(() => null);
  if (!existente?.data) return;
  await api(base, token, '/fields/location/mapa', { method: 'DELETE' }).catch((e) => console.warn(`  aviso al retirar location.mapa: ${e.message}`));
  console.log('• Campo retirado: location.mapa (osm-location-picker consolidado en el gestor)');
}

/**
 * Crea/actualiza (idempotente) el campo de presentación `company_profile.informacion_general`
 * que hospeda el gestor (Custom Interface). Alias (`schema: null`): no toca el schema.
 */
async function asegurarCampoManager(base, token) {
  const existente = await api(base, token, `/fields/company_profile/${CAMPO_MANAGER.field}`).catch(() => null);
  if (existente?.data) {
    await api(base, token, `/fields/company_profile/${CAMPO_MANAGER.field}`, { method: 'PATCH', body: JSON.stringify({ meta: CAMPO_MANAGER.meta }) });
  } else {
    await api(base, token, '/fields/company_profile', { method: 'POST', body: JSON.stringify({ field: CAMPO_MANAGER.field, type: CAMPO_MANAGER.type, schema: null, meta: CAMPO_MANAGER.meta }) });
  }
  console.log('• Gestor configurado: company_profile.informacion_general (interface company-info-manager)');
}

async function main() {
  const env = await cargarEnv();
  const base = (env.DIRECTUS_URL || env.PUBLIC_URL || 'http://localhost:8055').replace(/\/$/, '');
  const token = env.DIRECTUS_CONFIG_TOKEN?.trim();
  if (!token) throw new Error('Falta DIRECTUS_CONFIG_TOKEN.');

  console.log(`→ Configurando metadata en ${base} con credencial técnica ...`);

  // La carpeta usada por la navegación anterior deja de ser el punto de entrada.
  await api(base, token, `/collections/${FOLDER_ANTERIOR}`, {
    method: 'PATCH', body: JSON.stringify({ meta: { hidden: true } }),
  }).catch(() => {});

  // company_profile: singleton top-level, "Información General".
  await api(base, token, '/collections/company_profile', {
    method: 'PATCH',
    body: JSON.stringify({ meta: { singleton: true, hidden: false, icon: 'contact_page', group: null, sort: 1, translations: t('Información General'), note: 'Pantalla central para gestionar la información pública de la empresa.' } }),
  });

  for (const campo of ['id', 'singleton_key']) {
    await api(base, token, `/fields/company_profile/${campo}`, {
      method: 'PATCH', body: JSON.stringify({ meta: { hidden: true } }),
    });
  }

  // Campo receptor: etiqueta amigable en español (la columna física no cambia).
  for (const [campo, m] of Object.entries(CAMPOS_COMPANY_PROFILE)) {
    await api(base, token, `/fields/company_profile/${campo}`, { method: 'PATCH', body: JSON.stringify({ meta: m }) });
    console.log(`• Campo configurado: company_profile.${campo} → "${m.translations[0].translation}"`);
  }

  for (const [col, meta] of Object.entries(COLECCIONES)) {
    await api(base, token, `/collections/${col}`, { method: 'PATCH', body: JSON.stringify({ meta }) });
    console.log(`• Colección configurada: ${col} → "${meta.translations[0].translation}"`);

    for (const campo of TECNICOS) {
      await api(base, token, `/fields/${col}/${campo}`, { method: 'PATCH', body: JSON.stringify({ meta: { hidden: true } }) }).catch(() => {});
    }
    const idField = UUID_IDS[col];
    if (idField) {
      await api(base, token, `/fields/${col}/${idField}`, { method: 'PATCH', body: JSON.stringify({ meta: { hidden: true, special: ['uuid'], readonly: true } }) }).catch((e) => console.warn(`  aviso ${col}.${idField}: ${e.message}`));
    }
    for (const [campo, m] of Object.entries(CAMPOS[col] ?? {})) {
      await api(base, token, `/fields/${col}/${campo}`, { method: 'PATCH', body: JSON.stringify({ meta: m }) });
    }
  }

  await retirarCampoMapa(base, token);
  await asegurarCampoManager(base, token);

  for (const relacion of RELACIONES) await configurarAliasRelacional(base, token, relacion);

  console.log('✓ "Información General" configurada como pantalla singleton relacional.');
  console.log('  Las colecciones child siguen disponibles técnicamente, pero quedan ocultas de la navegación habitual.');
}

main().catch((e) => { console.error(`✗ ${e.message}`); process.exitCode = 1; });
