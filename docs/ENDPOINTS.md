# Catálogo de endpoints

Este documento registra exclusivamente endpoints de la API REST NestJS. El futuro frontend React consumirá únicamente esta API; nunca el CMS (Strapi) ni MySQL.

La API pública sigue sin controllers ni rutas: `Contact.Presentation/DTOs/SubmitContactRequestDto.ts` es solo un tipo plano preparado y no registra una ruta.

## Frontera interna administrativa de CompanyProfile (registrada y protegida)

CompanyProfile expone una frontera HTTP **interna** administrativa (`CompanyProfileCmsController`), registrada en `CompanyProfileModule` y protegida por `CmsServiceAuthGuard` (token técnico service-to-service `Authorization: Bearer <CMS_INTERNAL_TOKEN>`; no autentica personas, fail closed). La consume únicamente el **servidor** de Strapi, nunca el navegador. Cubre solo **CREATE/UPDATE con reglas de negocio**; el CMS resuelve GET y DELETE directamente contra MySQL (no pasan por NestJS).

| Método | Endpoint | Módulo | Request | Response canónica | Autenticación | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/internal/cms/company-profile/initialize` | CompanyProfile | `{ payload: { contact_request_recipient_email } }` | `{ payload: { id, singleton_key, contact_request_recipient_email } }` | `Bearer CMS_INTERNAL_TOKEN` | Implementado |
| POST | `/internal/cms/company-profile/contact-information` | CompanyProfile | `{ collection, payload }` | `{ payload }` | `Bearer CMS_INTERNAL_TOKEN` | Implementado (HU22) |
| POST | `/internal/cms/company-profile/contact-information/modify` | CompanyProfile | `{ collection, id, payload }` | `{ payload }` | `Bearer CMS_INTERNAL_TOKEN` | Implementado (HU23) |
| POST | `/internal/cms/company-profile/location` | CompanyProfile | `{ collection, payload }` | `{ payload }` | `Bearer CMS_INTERNAL_TOKEN` | Implementado (HU24) |
| POST | `/internal/cms/company-profile/location/modify` | CompanyProfile | `{ collection, id, payload }` | `{ payload: { address, latitude, longitude } }` | `Bearer CMS_INTERNAL_TOKEN` | Implementado (HU25) |
| POST | `/internal/cms/company-profile/contact-request-recipient-email` | CompanyProfile | `{ payload: { contact_request_recipient_email } }` | `{ payload: { contact_request_recipient_email } }` | `Bearer CMS_INTERNAL_TOKEN` | Implementado |

`initialize` crea el singleton `company_profile` cuando no existe (único caso de uso que puede crearlo; si ya existe responde 409). NestJS valida/canonicaliza y devuelve el payload; Strapi ejecuta la escritura final. Flujo:

```text
CREATE/UPDATE: Strapi Server → NestJS (CommandBus → Domain/Validator/Strategy) → payload canónico → Strapi → MySQL
GET / DELETE:  Strapi Server → MySQL (directo, sin NestJS)
```

Las **TypeORM migrations** gobiernan el schema de las tablas de negocio; Strapi solo sus tablas internas, sobre la base MySQL única compartida (ADR-027). NestJS es la autoridad de reglas de negocio, no un CRUD ni el escritor administrativo final.

> **Estado de la integración:** el backend (Guard + controller + endpoints) está implementado y probado. El lado Strapi tiene la lógica server-side implementada (`infrastructure/CMS/Strapi/src/plugins/company-profile/server/`: repositorio, cliente NestJS, servicio); el *wiring* de rutas admin, el Admin UI, OSM y branding quedan pendientes (ver `docs/ROADMAP.md`). No hay endpoints públicos.

## Reglas de mantenimiento

- Agregar/activar una fila solo en el mismo cambio que registra y verifica el endpoint.
- Actualizar también la tabla del `README.md`.
- Registrar método, ruta, módulo, visibilidad y contratos exactos.
- No reservar rutas, códigos HTTP o mecanismos de autenticación futuros.
- Documentar Request/Response DTOs, nunca Entities de Domain o TypeORM.
- No exponer stack traces, SQL, credenciales, configuración ni detalles de proveedores.
- Mantener separadas la API pública y la API interna para el CMS.

## API pública futura

Cuando exista el frontend, el Cliente sin autenticación consumirá lecturas públicas de Portfolio, Services y CompanyProfile y podrá enviar el formulario de Contact. Presentation mapeará HTTP y despachará mediante `QueryBus` o `CommandBus` de `@nestjs/cqrs`.

Las lecturas serán Queries sin efectos y proyectarán DTOs. El formulario futuro recibirá `SubmitContactRequestDto`, despachará un Command y compondrá `Client` + `ContactRequest`; no implicará persistencia histórica de ninguno ni involucrará al CMS. El Command, Handler, ports y endpoint aún no existen.
