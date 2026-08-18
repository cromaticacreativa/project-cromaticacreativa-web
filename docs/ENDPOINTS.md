# Catálogo de endpoints

Este documento registra exclusivamente endpoints implementados y verificados de la API ASP.NET Core. React deberá consumir esta API; nunca la API de Directus.

En la V1, el **Cliente** consume sin cuenta ni autenticación endpoints públicos de lectura y, cuando se implemente, el caso de uso para enviar el formulario de contacto. Este último produce un correo, pero no permite modificar contenido administrado ni implica persistir la solicitud. El **Administrador** gestiona contenido en Directus Data Studio. Las consultas administrativas leen PostgreSQL directamente; los Filter Hooks llaman endpoints internos de ASP.NET Core antes de cada mutación. No existen login de Cliente, registro, Identity, roles o permisos administrativos propios del backend.

Los endpoints serán añadidos a esta sección a medida que sean implementados. Actualmente no existe una API funcional ni rutas definidas.

| Método | Endpoint | Módulo | Request | Response | Estado |
| ------ | -------- | ------ | ------- | -------- | ------ |
| — | — | — | — | — | Pendiente: no hay endpoints implementados. |

## Reglas de mantenimiento

- Agregar una fila en el mismo cambio que implementa un endpoint.
- Actualizar también la tabla resumida de `README.md`.
- Registrar el método y la ruta exactos, respetando mayúsculas y parámetros reales.
- Identificar el módulo propietario.
- Resumir request y response o enlazar su documentación cuando crezcan.
- Indicar un estado verificable, por ejemplo `Implementado`, `Experimental` o `Deprecated` cuando esos estados existan en el proyecto.
- No registrar rutas planificadas como si estuvieran implementadas.
- No registrar endpoints de autenticación que no existan ni inventar el mecanismo Directus → ASP.NET Core.
- Documentar cambios incompatibles y la estrategia de versionado una vez definida.
- Documentar contratos de transporte, no Entities o Aggregate Roots de Domain.
- Mantener la frontera `Domain/proyección → Response DTO → HTTP → TypeScript type`; los nombres y carpetas React no forman parte del contrato de la API.
- Documentar únicamente errores y payloads públicos aprobados. No exponer stack traces, SQL, detalles SMTP, credenciales, configuración, nombres internos de proveedor ni excepciones de Domain/Application/Infrastructure.
- Mantener diferenciados los errores de validación/precondición del caso de uso y los fallos técnicos, aunque el mapping y los códigos HTTP concretos se definirán al implementar el primer contrato.

## API pública

Será consumida por React y contendrá operaciones de lectura para el Cliente. También deberá incorporar el caso de uso público de envío del formulario de contacto mediante un Command y un port de correo, sin Directus y sin autenticación. Las rutas se documentarán únicamente cuando estén implementadas.

## API interna para mutaciones de Directus

Será consumida principalmente por Filter Hooks bloqueantes de Directus para procesar create, update y delete antes de persistir. Estos endpoints despacharán Commands y devolverán un error o payload canónico; Directus ejecutará después la escritura final. No se usarán para cada consulta administrativa y no deben producir una segunda escritura con EF Core.

Las rutas y el mecanismo de autenticación/autorización todavía no están implementados ni definidos. No inventarlos en este catálogo.

## Información pendiente

Antes del primer endpoint deben establecerse Controllers o Minimal APIs, convención de rutas, estrategia de resultados/excepciones, tratamiento y mapping seguro de errores, validación, paginación y posible versionado de la API. Para el formulario también permanecen pendientes el contrato definitivo, proveedor y configuración de correo, validación del servicio mediante `Services`, protección antiabuso y mapeo seguro de fallos. Ninguna ruta ni código HTTP queda fijado por este catálogo.
