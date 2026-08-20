/**
 * Crea (una sola vez) el registro singleton `company_profile` que HU22/HU24
 * necesitan como padre de teléfonos/correos/redes/ubicación.
 *
 * Reproducible e idempotente: si el singleton ya existe, no hace nada. El correo
 * receptor (`contact_request_recipient_email`, NOT NULL) se toma de la variable
 * de entorno `COMPANY_RECIPIENT_EMAIL` — NO se hardcodea — para que sea
 * configurable en local y en Hostinger. Se crea vía la Directus Items API
 * (Directus es el escritor); `company_profile` no tiene Filter Hook (no es una
 * mutación de negocio HU22/HU24, es la inicialización del perfil).
 *
 * Uso (desde infrastructure/CMS/Directus):
 *   COMPANY_RECIPIENT_EMAIL=correo@empresa.com npm run seed:profile
 */

import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';

async function cargarEnv() {
  const env = { ...process.env };
  try {
    const c = await readFile(new URL('../.env', import.meta.url), 'utf8');
    for (const l of c.split(/\r?\n/)) {
      const t = l.trim();
      if (!t || t.startsWith('#') || !t.includes('=')) continue;
      const i = t.indexOf('=');
      const k = t.slice(0, i).trim();
      if (env[k] === undefined) env[k] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    }
  } catch { /* solo process.env */ }
  return env;
}

async function main() {
  const env = await cargarEnv();
  const base = (env.DIRECTUS_URL || env.PUBLIC_URL || 'http://localhost:8055').replace(/\/$/, '');
  const recipiente = (env.COMPANY_RECIPIENT_EMAIL || '').trim();
  if (!recipiente) {
    throw new Error('Falta COMPANY_RECIPIENT_EMAIL: correo receptor interno del formulario de contacto (no se inventa).');
  }
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) throw new Error('Faltan ADMIN_EMAIL / ADMIN_PASSWORD.');

  const login = await (await fetch(`${base}/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }),
  })).json();
  const token = login?.data?.access_token;
  if (!token) throw new Error('Credenciales de Administrador inválidas.');
  const H = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };

  // `company_profile` es una colección singleton: GET devuelve el objeto (con
  // `id: null` cuando la fila aún no existe) y se crea/actualiza con PATCH (upsert).
  const actual = await (await fetch(`${base}/items/company_profile?fields=id`, { headers: H })).json();
  if (actual?.data?.id) {
    console.log(`• El perfil singleton ya existe (${actual.data.id}). Sin cambios.`);
    return;
  }

  const r = await fetch(`${base}/items/company_profile`, {
    method: 'PATCH', headers: H,
    body: JSON.stringify({ id: randomUUID(), singleton_key: 1, contact_request_recipient_email: recipiente }),
  });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(`No se pudo crear el singleton: HTTP ${r.status} ${JSON.stringify(j?.errors ?? j)?.slice(0, 300)}`);
  console.log(`✓ Perfil singleton creado (${j.data.id}) con receptor ${recipiente}.`);
}

main().catch((e) => { console.error(`✗ ${e.message}`); process.exitCode = 1; });
