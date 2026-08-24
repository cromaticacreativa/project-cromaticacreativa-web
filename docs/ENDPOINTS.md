# Catálogo de endpoints

Este documento registra exclusivamente endpoints de la API REST NestJS. El futuro frontend React consumirá únicamente esta API; nunca el CMS (Strapi) ni MySQL.

La API pública sigue sin controllers ni rutas: `Contact.Presentation/DTOs/SubmitContactRequestDto.ts` es solo un tipo plano preparado y no registra una ruta.

## Frontera interna administrativa (no registrada en esta fase)

CompanyProfile define una frontera HTTP interna administrativa (`CompanyProfileCmsController`) con la lógica de HU22–HU25. Tras retirar Directus, esta frontera **no está registrada** en `CompanyProfileModule` y **no se expone**: el controller conserva su lógica de mapeo/despacho como código de migración, pero la autenticación service-to-service (CMS → NestJS) y su re-registro se implementarán junto con la integración de Strapi. Por eso, en esta fase, **no hay rutas activas**.

Cuando se re-registre, la frontera interna tendrá esta forma (la lógica ya existe):

| Método | Endpoint | Módulo | Request | Response | Autenticación | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/internal/cms/company-profile/contact-information` | CompanyProfile | `{ collection, payload }` | `{ payload }` | Pendiente (integración Strapi) | Lógica lista; no registrado |
| POST | `/internal/cms/company-profile/location` | CompanyProfile | `{ collection, payload }` | `{ payload }` | Pendiente (integración Strapi) | Lógica lista; no registrado |
| POST | `/internal/cms/company-profile/contact-request-recipient-email` | CompanyProfile | `{ collection?, payload?: { contact_request_recipient_email } }` | `{ payload: { contact_request_recipient_email } }` | Pendiente (integración Strapi) | Lógica lista; no registrado |
| POST | `/internal/cms/company-profile/contact-information/modify` | CompanyProfile | `{ collection, id, payload }` | `{ payload }` | Pendiente (integración Strapi) | Lógica lista; no registrado |
| POST | `/internal/cms/company-profile/location/modify` | CompanyProfile | `{ collection, id, payload }` | `{ payload: { address, latitude, longitude } }` | Pendiente (integración Strapi) | Lógica lista; no registrado |

Estas rutas, cuando existan, serán internas (no las consume el Cliente ni el frontend) y cubren solo **CREATE/UPDATE con reglas de negocio**. El flujo objetivo es:

```text
Administrador → Strapi Admin/Server → NestJS → Application → Domain → payload canónico → Strapi → MySQL (escritura final)
```

En el flujo objetivo (mediante la futura infraestructura custom de Strapi), los **GET** y **DELETE** de los datos de negocio los resolverá Strapi directo a MySQL, sin NestJS. NestJS es la autoridad de reglas de negocio (no un CRUD); las **TypeORM migrations** gobiernan el schema de las tablas de negocio y Strapi solo sus tablas internas, sobre la base MySQL única compartida (ADR-027).

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
