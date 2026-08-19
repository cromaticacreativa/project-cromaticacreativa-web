# Catálogo de endpoints

Este documento registra exclusivamente endpoints implementados y verificados de la API REST NestJS. El futuro frontend React consumirá únicamente esta API; nunca Directus o MySQL.

La fundación NestJS compila y sus cuatro módulos materializan Presentation, pero no contienen controllers ni rutas definidas. `Contact.Presentation/DTOs/SubmitContactRequestDto.ts` es solo un tipo plano de frontera preparado; no registra una ruta. El número de endpoints implementados es **cero**.

| Método | Endpoint | Módulo | Request | Response | Estado |
| --- | --- | --- | --- | --- | --- |
| — | — | — | — | — | No hay endpoints implementados |

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

## API interna futura

Si Directus supera la PoC, sus Filter Hooks bloqueantes llamarán endpoints internos NestJS antes de cada mutación administrativa. El endpoint despachará un Command y responderá con error, aprobación o payload canónico. Directus realizará la única escritura final; NestJS/TypeORM no duplicará esa persistencia.

No se ha definido ruta ni contrato. La autenticación Directus → NestJS permanece pendiente en ADR-023; Directus sigue siendo provisional y no está desplegado ni validado en el Hostinger Business Web Hosting existente.

## Pendientes antes del primer endpoint

Faltan los primeros casos de uso, convención de rutas, DTOs, validación, mapping de errores, versionado si fuera necesario, autenticación de API interna, tests HTTP y contratos reales. Ninguno se fija desde este catálogo.
