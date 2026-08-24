/**
 * Aplica el branding de Cromática Creativa a una instancia de Directus 12.3.0
 * usando exclusivamente la API REST oficial (Project Settings + Files). No
 * modifica el core ni node_modules; es idempotente y reproducible.
 *
 * Requisitos: Directus en ejecución y un Static Access Token con permisos de
 * configuración. Lee de las variables de entorno (o del `.env` del CMS):
 * DIRECTUS_URL (o PUBLIC_URL), DIRECTUS_CONFIG_TOKEN. Node 22
 * (fetch/FormData/Blob globales).
 *
 * Uso (desde infrastructure/CMS/Directus):  npm run brand
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const AQUI = new URL('./', import.meta.url);
const RAIZ_CMS = new URL('../', AQUI);

/**
 * Isotipo limpio (la "C" del favicon, fondo transparente). Se usa TANTO para el
 * logo del proyecto (cabecera del login y del panel) COMO para el favicon del
 * navegador. NO se usa `logo/logo-oficial-CC.webp` (lockup vertical con el
 * texto "CROMÁTICA creativa"): como logo pequeño se recorta/duplica el nombre y
 * como `public_foreground` provocaba el logo grande flotando en el login.
 */
const ISOTIPO = {
  titulo: 'Cromática Creativa — Isotipo',
  archivo: new URL('favicon/favicon-cc.png', AQUI),
  tipo: 'image/png',
  nombre: 'favicon-cc.png',
};

const PROJECT_NAME = 'Cromática Creativa';
const PROJECT_COLOR = '#7c3aed';

async function cargarEnv() {
  const env = { ...process.env };
  try {
    const contenido = await readFile(new URL('.env', RAIZ_CMS), 'utf8');
    for (const linea of contenido.split(/\r?\n/)) {
      const limpia = linea.trim();
      if (!limpia || limpia.startsWith('#')) continue;
      const idx = limpia.indexOf('=');
      if (idx < 0) continue;
      const clave = limpia.slice(0, idx).trim();
      if (env[clave] === undefined) env[clave] = limpia.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    }
  } catch { /* sin .env: se usa solo process.env */ }
  return env;
}

async function pedir(url, token, opciones = {}) {
  let respuesta;
  try {
    respuesta = await fetch(url, {
      ...opciones,
      headers: { ...(opciones.headers ?? {}), authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error('Directus no está disponible.');
  }
  if (respuesta.status === 401) throw new Error('DIRECTUS_CONFIG_TOKEN no es válido.');
  if (respuesta.status === 403) throw new Error('DIRECTUS_CONFIG_TOKEN no tiene permisos suficientes.');
  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => '');
    throw new Error(`HTTP ${respuesta.status} en ${url}: ${detalle.slice(0, 300)}`);
  }
  return respuesta.status === 204 ? null : respuesta.json();
}

async function asegurarArchivo(base, token, spec) {
  const consulta = new URL('/files', base);
  consulta.searchParams.set('filter[title][_eq]', spec.titulo);
  consulta.searchParams.set('fields', 'id');
  consulta.searchParams.set('limit', '1');
  const existente = await pedir(consulta, token);
  if (existente?.data?.[0]?.id) {
    console.log(`• Archivo ya presente: ${spec.titulo} (${existente.data[0].id})`);
    return existente.data[0].id;
  }
  const contenido = await readFile(spec.archivo);
  const forma = new FormData();
  forma.append('title', spec.titulo);
  forma.append('file', new Blob([contenido], { type: spec.tipo }), spec.nombre);
  const subido = await pedir(new URL('/files', base), token, { method: 'POST', body: forma });
  console.log(`• Archivo subido: ${spec.titulo} (${subido.data.id})`);
  return subido.data.id;
}

async function main() {
  const env = await cargarEnv();
  const base = (env.DIRECTUS_URL || env.PUBLIC_URL || 'http://localhost:8055').replace(/\/$/, '');
  const token = env.DIRECTUS_CONFIG_TOKEN?.trim();
  if (!token) throw new Error('Falta DIRECTUS_CONFIG_TOKEN.');

  console.log(`→ Aplicando branding en ${base} con credencial técnica ...`);

  const isotipoId = await asegurarArchivo(base, token, ISOTIPO);

  const customCss = await readFile(new URL('custom.css', AQUI), 'utf8');
  const themeOverrides = JSON.parse(await readFile(new URL('theme-light-overrides.json', AQUI), 'utf8'));

  // Branding esencial. `project_logo` y `project_favicon` usan el mismo isotipo.
  // `public_foreground`/`public_background` se ANULAN (null): así se elimina el
  // logo grande del login y se conserva la animación de puntos por defecto.
  console.log('→ Aplicando Project Settings ...');
  await pedir(new URL('/settings', base), token, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      project_name: PROJECT_NAME,
      // Quita el subtítulo "Application" del login (el campo real que lo alimenta).
      project_descriptor: '',
      // Idioma por defecto: usa las traducciones oficiales de Directus. Las vistas
      // públicas de autenticación (login, reset-password) se muestran en español.
      // es-ES es la traducción COMPLETA (es-419 es parcial y dejaría textos en
      // inglés). Cada usuario puede fijar su propio idioma en su perfil.
      default_language: 'es-ES',
      project_color: PROJECT_COLOR,
      project_logo: isotipoId,
      // En Directus 12.3.0 el favicon del navegador es `public_favicon` (NO
      // `project_favicon`). Con el campo equivocado, Directus caía a un círculo
      // morado generado desde project_color: esa era la causa del "favicon morado".
      public_favicon: isotipoId,
      public_foreground: null,
      public_background: null,
      default_appearance: 'light',
      custom_css: customCss,
    }),
  });

  // Overrides del theme claro (color primario). Best-effort: si la forma del token
  // cambia entre versiones, no debe bloquear el branding esencial ya aplicado.
  try {
    await pedir(new URL('/settings', base), token, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ theme_light_overrides: themeOverrides }),
    });
    console.log('• theme_light_overrides aplicado.');
  } catch (error) {
    console.warn(`• Aviso: no se aplicó theme_light_overrides (${error.message}). El color primario ya proviene de project_color.`);
  }

  console.log('✓ Branding de Cromática Creativa aplicado. Recargue /admin/login con hard refresh.');
  console.log(`  (script: ${fileURLToPath(import.meta.url)})`);
}

main().catch((error) => {
  console.error(`✗ No se pudo aplicar el branding: ${error.message}`);
  process.exitCode = 1;
});
