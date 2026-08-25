# Strapi — CMS administrativo de Cromática Creativa

Strapi 5 (TypeScript) es el CMS administrativo del proyecto: panel de
administración, autenticación de administradores y roles/permisos. Es una
**aplicación Node independiente** (su propio `package.json`, proceso, dependencias
y configuración), pero **comparte la misma base de datos MySQL** que el backend
(ADR-027).

> Strapi **no** es un Bounded Context ni un módulo NestJS. No se le aplican las
> capas Domain/Application/Infrastructure/Presentation. Reemplaza al CMS provisional
> anterior (Directus), retirado definitivamente (ver `docs/DECISIONS.md`, ADR-025 y
> ADR-027; la ADR-026 intermedia fue descartada).

## Responsabilidades

Strapi (CMS):

- panel administrativo y Admin UI;
- autenticación de administradores, roles y permisos;
- **dueño únicamente de sus propias tablas internas** (usuarios, roles, permisos,
  configuración, sesiones/tokens);
- en una fase posterior, mediante **infraestructura custom**, leerá/escribirá los
  **datos** de las tablas de negocio (no su estructura).

Strapi **no** es dueño del schema de las tablas de negocio, no las modela como
content-types nativos y no las crea, altera ni migra.

NestJS (reglas de negocio): Commands, Handlers, Strategies, Validators, Value
Objects, Aggregate y canonicalización en los CREATE/UPDATE que requieran negocio;
devuelve un payload canónico al CMS y no es el escritor administrativo final.

TypeORM migrations: **única autoridad estructural** de las tablas de negocio.

MySQL: enforcement estructural (NOT NULL, UNIQUE, FK, CHECK, tipos).

## Base de datos ÚNICA compartida (ownership separado)

Strapi y las tablas de negocio viven en **una sola** base MySQL/MariaDB (por
ejemplo `cromatica_prod`). No hay base separada `strapi_*`. Compartir la conexión
**no** implica compartir ownership del schema:

| Base única (`cromatica_prod`) | Dueño del schema | Contenido |
| --- | --- | --- |
| tablas internas de Strapi | **Strapi** (bootstrap) | administradores, roles, permisos, configuración, sesiones/tokens |
| `company_profile`, `phone`, `email`, `social_link`, `location`, `project`, `media`, `service`, `category`, `corporate_client` | **TypeORM migrations** | tablas de negocio |

TypeORM crea y evoluciona las tablas de negocio mediante sus migrations
(`synchronize: false`). Strapi solo gestiona sus tablas internas. Cliente de base
de datos: **MySQL / MariaDB**. No se usa SQLite.

## Requisitos

- Node.js 22 (`engines` de Strapi 5 admite `>=20 <=26`).
- Acceso a la misma base MySQL/MariaDB del backend.

## Variables de entorno

Copie `.env.example` a `.env` y reemplace los placeholders con secretos reales por
ambiente. `.env` nunca se versiona.

| Variable | Descripción |
| --- | --- |
| `HOST` | Interfaz de escucha (por defecto `0.0.0.0`). |
| `PORT` | Puerto HTTP (por defecto `1337`). |
| `APP_KEYS` | Lista de claves de sesión separadas por comas. |
| `API_TOKEN_SALT` | Salt de API tokens. |
| `ADMIN_JWT_SECRET` | Secreto del JWT del panel admin. |
| `TRANSFER_TOKEN_SALT` | Salt de transfer tokens. |
| `JWT_SECRET` | Secreto JWT de users-permissions. |
| `ENCRYPTION_KEY` | Clave de cifrado interna de Strapi. |
| `STRAPI_DB_HOST` | Host de la base **única compartida** (igual que `MYSQL_HOST`). |
| `STRAPI_DB_PORT` | Puerto de la base compartida. |
| `STRAPI_DB_NAME` | Nombre de la base compartida — **debe coincidir con `MYSQL_DATABASE`**. |
| `STRAPI_DB_USER` | Usuario de la base compartida. |
| `STRAPI_DB_PASSWORD` | Contraseña de la base compartida. |
| `STRAPI_DB_SSL` | `true`/`false` para SSL de la conexión. |
| `BACKEND_INTERNAL_URL` | URL del backend NestJS para CREATE/UPDATE (solo servidor). Local `http://localhost:3000`; prod `https://api.cromaticacreativa.com`. |
| `CMS_INTERNAL_TOKEN` | Token técnico Bearer hacia NestJS (solo servidor); debe coincidir EXACTAMENTE con el backend. Nunca en el bundle admin. |

> `BACKEND_INTERNAL_URL` y `CMS_INTERNAL_TOKEN` son **solo de servidor**: no llevan
> prefijo `STRAPI_ADMIN_` ni se referencian desde `src/admin/`, por lo que no se
> incluyen en el bundle del navegador.

## Integración CompanyProfile (Información General)

Integración administrativa **completa** de la Información General (ADR-028):

- **Server-side** ([`src/company-profile/`](src/company-profile/README.md)): repositorio
  (Knex interno de Strapi, parametrizado, sin content-types), cliente NestJS
  fail-closed, servicio de orquestación y rutas **admin** con **RBAC de servidor**
  (`admin::isAuthenticatedAdmin` + `admin::hasPermissions` por operación:
  `admin::company-profile.{read,create,update,delete}`), registradas en `src/index.ts`
  (compiladas por `strapi build`). GET/DELETE directos a MySQL; CREATE/UPDATE vía
  NestJS → payload canónico → Strapi → MySQL. Endurecimiento: validación de UUID,
  UPDATE que distingue 404 (inexistente) de idempotente, y errores MySQL traducidos.
- **Geocoding OSM** (`GET /company-profile/geocode`): proxy server-side de Nominatim,
  **solo al pulsar "Buscar"** (no autocomplete), con User-Agent, throttle, timeout y
  **cache acotado** (TTL 24 h, máx. 200 entradas, clave normalizada).
- **Admin UI** (`src/admin/app.tsx` + `src/admin/pages/InformacionGeneral.tsx`):
  menú "Información General" (permiso `read`) con los bloques de correo receptor,
  teléfonos, correos, redes sociales y ubicación (mapa OSM embebido + botón Buscar).
  Botones ocultos según permisos (`useRBAC`). Branding/logo/favicon/paleta aplicados
  (login/menú/tema).
- Pruebas: `npm run test:server` (31). Verificación de arranque: registra las
  acciones RBAC y las rutas responden 401 sin admin y 404 en rutas inexistentes.

`CMS_INTERNAL_TOKEN` y `BACKEND_INTERNAL_URL` son **solo de servidor** (verificado:
no aparecen en el bundle del Admin).

## Scripts

```bash
npm install       # instalar dependencias
npm run develop   # desarrollo con recarga (crea el primer admin en el primer arranque)
npm run build     # compilar el panel de administración
npm run start     # ejecutar en producción (requiere build previo)
npm run test:server  # tests unitarios de la lógica server-side de CompanyProfile
```

## Despliegue objetivo — Hostinger Business (managed Node)

Topología objetivo de dominios:

- `admin.cromaticacreativa.com` → Strapi (este proyecto)
- `api.cromaticacreativa.com` → NestJS (backend)
- `cromaticacreativa.com` → frontend público (futuro)

Configuración como aplicación Node administrada en Hostinger Business:

- **Root directory (application root):** `infrastructure/CMS/Strapi`
- **Node version:** 22
- **Install command:** `npm install`
- **Build command:** `npm run build`
- **Start command / entry:** `npm run start` (Strapi arranca con `strapi start`; no
  requiere un `entry file` manual). El puerto debe leerse de `PORT` que asigne el
  panel de Hostinger.
- **Base de datos:** la **misma** base MySQL/MariaDB del backend, configurada
  mediante las variables `STRAPI_DB_*` (que apuntan a la base `MYSQL_*`).

No se requiere Docker (el plan actual es managed hosting, no VPS). No se usan hacks
específicos de CMS anteriores (Directus/isolated-vm).

## Estado — PoC pendiente

La ejecución de Strapi sobre el Hostinger Business Web Hosting existente es una
**PoC pendiente**; no se afirma que funcione ni que tenga soporte oficial hasta
validarla. Ver `docs/ROADMAP.md` (Fase 5).

## Pendiente para la siguiente fase (no incluido aquí)

- Portfolio y Services (aún sin integración CMS);
- marcador OSM arrastrable/click-to-set (mejora con react-leaflet); hoy el punto se fija por búsqueda o entrada manual;
- verificación E2E con un administrador autenticado (click-through completo);
- storage/operación de multimedia.

La integración de **CompanyProfile / Información General** (server-side, rutas admin,
UI, OSM, branding, login) está implementada en esta fase (ADR-028).
