# Catálogo de endpoints

Este documento registra exclusivamente endpoints implementados y verificados de la API REST NestJS. El futuro frontend React consumirá únicamente esta API; nunca Directus o MySQL.

La API pública sigue sin controllers ni rutas: `Contact.Presentation/DTOs/SubmitContactRequestDto.ts` es solo un tipo plano preparado y no registra una ruta. Las únicas rutas implementadas son internas (no públicas) y pertenecen a CompanyProfile: HU22 "Agregar información de contacto" y HU24 "Agregar ubicación".

| Método | Endpoint | Módulo | Request | Response | Autenticación | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/internal/cms/company-profile/contact-information` | CompanyProfile | `AgregarInformacionDeContactoRequestDto` `{ collection, payload }` | `AgregarInformacionDeContactoResponseDto` `{ payload }` | `Bearer CMS_INTERNAL_TOKEN` (`CmsInternalAuthGuard`) | Implementado (HU22) |
| POST | `/internal/cms/company-profile/location` | CompanyProfile | `AgregarUbicacionRequestDto` `{ collection, payload }` | `AgregarUbicacionResponseDto` `{ payload }` | `Bearer CMS_INTERNAL_TOKEN` (`CmsInternalAuthGuard`) | Implementado (HU24) |
| POST | `/internal/cms/company-profile/contact-request-recipient-email` | CompanyProfile | `{ collection, payload: { contact_request_recipient_email } }` | `{ payload: { contact_request_recipient_email } }` | `Bearer CMS_INTERNAL_TOKEN` (`CmsInternalAuthGuard`) | Implementado (validación mínima del correo receptor; no HU23 completa) |

Rutas internas únicamente: las invoca el Filter Hook de Directus, no el Cliente ni el futuro frontend React; Directus ejecuta la única escritura final.

- `contact-information` (HU22): valida y normaliza la creación de un teléfono, correo o red social. `collection` admite `phone`, `email` o `social_link`; cualquier otra colección responde 400. Una entrada inválida o duplicada responde 422 y Directus cancela la creación.
- `location` (HU24): valida y normaliza la creación de la ubicación (`address`, `latitude`, `longitude`) y devuelve el payload canónico con el `company_profile_id` del perfil singleton. Si el perfil no existe, ya hay ubicación o los datos son inválidos, responde 422 y Directus cancela la creación. Modificar (HU25) y eliminar la ubicación siguen pendientes.

## Reglas de mantenimiento

- Agregar una fila solo en el mismo cambio que implementa y verifica el endpoint.
- Actualizar también la tabla del `README.md`.
- Registrar método, ruta, módulo, visibilidad y contratos exactos.
- No reservar rutas, códigos HTTP o mecanismos de autenticación futuros.
- Documentar Request/Response DTOs, nunca Entities de Domain o TypeORM.
- No exponer stack traces, SQL, credenciales, configuración ni detalles de proveedores.
- Mantener separadas la API pública y la API interna para un CMS.

## API pública futura

Cuando exista el frontend, el Cliente sin autenticación consumirá lecturas públicas de Portfolio, Services y CompanyProfile y podrá enviar el formulario de Contact. Presentation mapeará HTTP y despachará mediante `QueryBus` o `CommandBus` de `@nestjs/cqrs`.

Las lecturas serán Queries sin efectos y proyectarán DTOs. El formulario futuro recibirá `SubmitContactRequestDto`, despachará un Command y compondrá `Client` + `ContactRequest`; no implicará persistencia histórica de ninguno ni involucrará Directus. El Command, Handler, ports y endpoint aún no existen.

## API interna administrativa

HU22 materializa el primer endpoint interno. Su Filter Hook bloqueante llama a `POST /internal/cms/company-profile/contact-information` antes de cada creación de `phone`, `email` o `social_link`. El controller autentica con `CmsInternalAuthGuard`, despacha `AgregarInformacionDeContactoCommand` y responde con el payload canónico o un rechazo; Directus realiza la única escritura final y NestJS/TypeORM no duplica esa persistencia.

La autenticación Directus → NestJS quedó resuelta en ADR-023 (token técnico `Bearer`, distinto por ambiente). HU23 (modificar contacto), HU24/HU25 (ubicación) y la eliminación agregarán, cuando se implementen, sus propios endpoints internos; no se reservan aquí. Directus sigue siendo provisional y no está validado en el Hostinger Business Web Hosting existente.

## Pendientes antes del primer endpoint público

La API pública (Queries de Portfolio/Services/CompanyProfile y el formulario de Contact) todavía no tiene casos de uso, convención de rutas, DTOs, mapping de errores ni tests HTTP. Ninguno se fija desde este catálogo.
