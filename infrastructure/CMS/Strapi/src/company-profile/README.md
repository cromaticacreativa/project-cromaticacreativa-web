# CompanyProfile — Integración CMS (Información General)

Integración administrativa de **CompanyProfile** coherente con ADR-027/ADR-028: las
tablas de negocio las gobiernan las TypeORM migrations; Strapi **no** las modela como
content-types. Este código accede a ellas server-side con queries parametrizadas
(Knex interno de Strapi) y delega las reglas de negocio en NestJS.

## Carga por Strapi (importante)

Este código vive bajo `src/company-profile/` (NO bajo `src/plugins/**`, que el build
de Strapi excluye). Se importa desde `src/index.ts`, por lo que **`strapi build` lo
compila** y Strapi lo **carga en runtime** (rutas registradas en `register()`).

## Estructura

- `server/database.ts` — puerto mínimo tipo Knex + nombres de tabla.
- `server/types.ts` — contratos y la proyección `CompanyProfileView`.
- `server/repository.ts` — acceso a `company_profile`/`phone`/`email`/`social_link`/`location`.
- `server/nestClient.ts` — cliente HTTP fail-closed hacia `/internal/cms/company-profile/*`.
- `server/errors.ts` — errores seguros + traducción de constraints MySQL.
- `server/service.ts` — orquestación GET/DELETE directos y CREATE/UPDATE vía NestJS.
- `server/geocoding.ts` — proxy Nominatim (OSM) con throttle/User-Agent.
- `server/controller.ts` — handlers Koa (admin).
- `server/routes.ts` — router `type: 'admin'` protegido por `admin::isAuthenticatedAdmin`.
- `register.ts` — instancia el servicio (`strapi.db.connection` + env) y registra rutas/permisos.

El Admin UI vive en `../admin/` (`app.tsx` + `pages/InformacionGeneral.tsx`).

## Flujo (ADR-027/ADR-028)

```
GET     : Admin UI → ruta admin Strapi → service.getInformacionGeneral() → MySQL
DELETE  : Admin UI → ruta admin Strapi → service.deleteX(id)            → MySQL
CREATE  : Admin UI → ruta admin Strapi → NestJS (valida/canonicaliza) → payload → Strapi → MySQL
UPDATE  : Admin UI → ruta admin Strapi → NestJS (valida/canonicaliza) → payload → Strapi → MySQL
```

Fail closed: si NestJS rechaza, cae o hace timeout, **no** se escribe en MySQL.

## Variables de entorno (solo servidor; nunca en el bundle admin)

- `BACKEND_INTERNAL_URL` — `http://localhost:3000` (local) / `https://api.cromaticacreativa.com` (prod).
- `CMS_INTERNAL_TOKEN` — debe coincidir EXACTAMENTE con el backend.

## Tests

`npm run test:server` (repositorio, cliente NestJS, servicio, geocoding, errores).
