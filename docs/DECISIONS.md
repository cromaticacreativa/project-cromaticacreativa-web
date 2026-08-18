# Decisiones arquitectónicas

Este registro ligero conserva el contexto, la decisión y las consecuencias de las decisiones arquitectónicas aprobadas. No sustituye el detalle de `ARCHITECTURE.md`.

Estados utilizados en este documento:

- **Aceptada**: decisión vigente que debe respetarse.
- **Pendiente**: decisión necesaria cuyo mecanismo todavía no ha sido seleccionado.
- **Reemplazada**: decisión conservada como historial, sustituida por otra ADR.

## ADR-001 — Monolito modular

**Estado:** Aceptada

### Contexto

El alcance actual no justifica microservicios y se desea mantener módulos aislados con un único deployment. El equipo necesita límites claros sin asumir complejidad operativa, comunicación distribuida o consistencia eventual de forma prematura.

### Decisión

Construir un único backend desplegable como monolito modular dentro del monorepo. Todos los módulos pertenecerán a la misma aplicación y deployment, utilizarán PostgreSQL y protegerán sus límites mediante APIs públicas explícitas entre módulos. Los módulos son candidatos a alinearse con Bounded Contexts, cuya correspondencia se define por lenguaje y modelo de negocio, no por tablas o carpetas. No se introducirán microservicios.

### Consecuencias

- Operación y despliegue iniciales más sencillos.
- Los límites modulares deben protegerse mediante estructura, revisión y tests cuando sea útil.
- Compartir proceso o base de datos no permite consumir `internal/` ni tablas de otro módulo.
- No se comparten Entities o Aggregate Roots entre módulos/Bounded Contexts.
- Una extracción futura solo se evaluaría ante necesidades demostradas y requeriría una nueva decisión.

## ADR-002 — Arquitectura hexagonal

**Estado:** Aceptada

### Contexto

El dominio y los casos de uso deben mantenerse independientes de ASP.NET Core, PostgreSQL, Directus y otros detalles técnicos. También se necesita que los adaptadores puedan evolucionar sin trasladar lógica de negocio a infraestructura o HTTP.

### Decisión

Aplicar arquitectura hexagonal dentro de cada módulo. Domain es la capa más interna y Application depende de ella para orquestar el modelo. Presentation depende de Application. Infrastructure puede depender de Application y Domain para implementar ports, mappings y adaptadores correspondientes. Domain no depende de ninguna capa externa y Application no depende de Presentation o Infrastructure.

### Consecuencias

- Domain permanece libre de dependencias técnicas.
- Application sí utiliza Entities, Aggregates, Value Objects o Domain Services cuando el caso de uso lo requiere, pero no reimplementa sus invariantes.
- Presentation se limita a la traducción HTTP y delega casos de uso.
- Infrastructure concentra EF Core y otros adaptadores.
- Las abstracciones genuinas de reglas de Domain pueden residir en Domain; los ports para recursos externos de casos de uso residen normalmente en Application.
- Las implementaciones técnicas se suministran mediante Dependency Injection, no se construyen desde Application.
- Requiere disciplina para no introducir abstracciones vacías ni saltarse capas.

## ADR-003 — CQRS + MediatR

**Estado:** Aceptada

### Contexto

La API necesita casos de uso explícitos y una separación clara entre lecturas y acciones. React realizará lecturas públicas y enviará el formulario público de contacto; Directus enviará operaciones administrativas a ASP.NET Core.

### Decisión

Usar Commands para intenciones de cambio o acciones con efectos, Queries para lecturas sin efectos y MediatR como dispatcher in-process desde Presentation a los Handlers de Application. No todos los módulos deben tener ambos tipos de mensaje; solo se crearán casos de uso reales.

### Consecuencias

- Las intenciones y responsabilidades de cada caso de uso quedan explícitas.
- Presentation no necesita conocer la implementación del Handler.
- Las consultas públicas se expresan principalmente como Queries.
- El formulario público de contacto se expresa como un Command porque produce el efecto externo de enviar correo; una Query no realiza ese envío.
- Las mutaciones administrativas de Directus requieren Commands en ASP.NET Core para procesar reglas y devolver aprobación, error o payload canónico; Directus ejecuta la escritura final.
- Se evita crear Commands CRUD artificiales por simetría.
- Debe controlarse la proliferación de tipos y comportamientos transversales innecesarios.

## ADR-004 — Entity Framework Core + PostgreSQL

**Estado:** Aceptada

### Contexto

Los datos del dominio requieren una base relacional con esquema reproducible, constraints reales y evolución versionada desde .NET. ASP.NET Core y Directus necesitan acceso técnico al mismo esquema con responsabilidades diferentes.

### Decisión

Usar PostgreSQL para los datos del dominio y Entity Framework Core como ORM y autoridad de su esquema. EF Core Configuration y EF Core Migrations definirán, versionarán y evolucionarán tablas y constraints. ASP.NET Core consultará mediante EF Core; Directus se conectará directamente al esquema existente para consultas administrativas y persistencia final de mutaciones aprobadas.

### Consecuencias

- Los cambios persistentes requieren migrations versionadas y revisadas.
- EF Core permanece en Infrastructure y no contamina Domain.
- PostgreSQL aplicará `PRIMARY KEY`, `NOT NULL`, `UNIQUE`, `FOREIGN KEY`, `CHECK`, índices y reglas de eliminación cuando correspondan.
- Directus puede leer y escribir datos, pero no crear, eliminar o modificar tablas, columnas, constraints, Foreign Keys o relaciones del dominio.
- EF Core puede recuperar estado actual durante una mutación administrativa sin convertirse en un segundo escritor de esa operación.
- Estrategias de `DbContext`, schemas y migrations se decidirán durante la fundación técnica.

## ADR-005 — Directus como backoffice consumidor de ASP.NET Core

**Estado:** Reemplazada por ADR-009 y ADR-010

> Registro histórico no vigente. Se conserva para explicar la evolución de la integración.

### Contexto

El Administrador necesita editar contenido sin construir un panel propio. Los casos de uso, invariantes y tablas del dominio deben permanecer bajo control de ASP.NET Core y EF Core.

### Decisión

Usar Directus self-hosted como CMS/backoffice para uno o, como máximo, dos Administradores. Directus será adaptado para consumir la API administrativa de ASP.NET Core mediante DTOs HTTP y Commands/Queries; no leerá ni escribirá directamente las tablas del dominio. La técnica concreta de extensión no se fija hasta implementarla.

### Consecuencias

- Se evita desarrollar inicialmente un panel administrativo propio.
- ASP.NET Core no implementa login, cuentas, Identity, roles o panel administrativo propio para personas en la V1; la autenticación técnica de Directus contra la API se registra por separado como pendiente.
- ASP.NET Core continúa siendo la única API del frontend público.
- ASP.NET Core también es la puerta de entrada de las operaciones administrativas del dominio.
- Los datos internos de Directus son responsabilidad del CMS; su topología de persistencia sigue pendiente.
- La integración de los formularios administrativos de Directus y la autenticación Directus → ASP.NET Core deberán resolverse antes de producción.

## ADR-006 — React como frontend público

**Estado:** Aceptada

### Contexto

El Cliente requiere una interfaz pública responsive y sin autenticación, independiente del backoffice y capaz de consultar contenido y enviar el formulario de contacto mediante contratos de la API oficial.

### Decisión

Construir el frontend público con React y TypeScript, HTML5 y CSS3. El Cliente lo utiliza sin cuenta ni login. Se centralizará la comunicación HTTP mediante Fetch API o un cliente posteriormente aprobado, consumiendo exclusivamente ASP.NET Core.

El frontend se organizará conceptualmente con composición de aplicación, Pages, Features, Components, Hooks, Services/API clients, Types, Utils y Assets según existan responsabilidades reales. No replicará artificialmente las capas hexagonales del backend.

### Consecuencias

- Frontend y backend evolucionan como aplicaciones separadas dentro del monorepo.
- La UI depende de contratos HTTP, no del modelo interno de .NET ni de Directus.
- Pages y Components componen UI; Features/Hooks encapsulan comportamiento React; Services centralizan ASP.NET Core. Los services no dependen de hooks.
- React no envía correo directamente ni conoce credenciales, destinatarios internos o detalles del proveedor.
- Cualquier framework adicional requiere aprobación y justificación.
- La estructura definitiva, versiones y herramientas de frontend quedan pendientes.

## ADR-007 — Contenido institucional estático en código

**Estado:** Aceptada

### Contexto

Misión, visión, descripción institucional general, eslóganes y textos corporativos de muy baja frecuencia de modificación no necesitan un ciclo editorial mediante CMS en la V1.

### Decisión

Mantener ese contenido en código. No crear una entidad `SiteSettings`, un módulo `Site` o tablas equivalentes únicamente para hacerlo administrable. Directus gestionará proyectos, multimedia de proyectos, Clientes Corporativos, servicios, información de contacto, redes sociales y ubicación conforme a ADR-009 y ADR-010.

### Consecuencias

- El contenido institucional estático cambia mediante el flujo normal de código y deployment.
- Se evita modelado y persistencia innecesarios.
- Trasladarlo al CMS requerirá una necesidad real y la actualización de esta decisión.

## ADR-008 — Autenticación Directus → ASP.NET Core

**Estado:** Pendiente

### Contexto

Los Filter Hooks de Directus invocarán endpoints internos de ASP.NET Core para procesar mutaciones administrativas. Esa comunicación deberá autenticarse y autorizarse antes de producción.

### Decisión

El mecanismo técnico todavía no está decidido. No se adopta como definitiva ninguna estrategia —JWT, API Key, OAuth, mTLS u otra— hasta evaluar e implementar la integración.

### Consecuencias

- Los endpoints administrativos no deben exponerse en producción sin esta protección.
- La integración de Directus debe diseñarse admitiendo el mecanismo que se apruebe.
- La decisión se completará cuando existan requisitos operativos y una implementación verificable.

## ADR-009 — Directus conectado al esquema de dominio administrado por EF Core

**Estado:** Aceptada

### Contexto

Directus Data Studio necesita presentar formularios, listados y vistas administrativas sobre los datos reales. Al mismo tiempo, el esquema del dominio debe permanecer reproducible, revisable y controlado desde .NET.

### Decisión

Directus se conectará directamente a PostgreSQL e introspeccionará el esquema existente creado por EF Core Migrations. Podrá consultar tablas del dominio y ejecutará la persistencia final de mutaciones administrativas aprobadas. EF Core seguirá siendo la autoridad exclusiva de mappings, schema y migrations; el Data Model del dominio no se diseñará ni alterará desde Directus.

### Consecuencias

- Las consultas administrativas no pasan por ASP.NET Core.
- Directus y ASP.NET Core/EF Core comparten acceso técnico a los datos con credenciales de mínimo privilegio.
- Los usuarios editoriales no deben tener privilegios irrestrictos para cambiar tablas, columnas, constraints, Foreign Keys o relaciones.
- Después de una migration, Directus debe adaptarse o introspeccionar la estructura actualizada.
- Los constraints de PostgreSQL continúan siendo la protección estructural final.

## ADR-010 — Filter Hooks bloqueantes para mutaciones administrativas

**Estado:** Aceptada

### Contexto

Las mutaciones iniciadas en Directus deben respetar casos de uso, reglas e invariantes de Domain sin convertir ASP.NET Core y Directus en dos escritores de la misma operación.

### Decisión

Interceptar cada create, update o delete de datos del dominio mediante un Filter Hook bloqueante antes de que Directus persista. El Hook llamará a un endpoint interno de ASP.NET Core; Presentation despachará un Command con MediatR; Application orquestará Domain para autorizar, rechazar o transformar la operación. El Hook cancelará una operación rechazada o devolverá el payload canónico aprobado, y Directus ejecutará el único `INSERT`, `UPDATE` o `DELETE` final.

ASP.NET Core podrá consultar estado actual con EF Core para reconstruir un Aggregate o evaluar reglas, pero no ejecutará `Add`, `Update`, `Remove` o `SaveChanges` como persistencia final de esa misma mutación.

### Consecuencias

- No existe doble escritura entre ASP.NET Core y Directus.
- Los endpoints internos procesan intenciones y resultados; no son un segundo canal de persistencia.
- El Filter Hook debe esperar la respuesta y bloquear la mutación hasta obtenerla.
- El mecanismo de autenticación y autorización Hook → ASP.NET Core permanece pendiente según ADR-008.
- Deben probarse aprobación, rechazo, transformación de payload y ausencia de persistencia duplicada.

## Decisiones abiertas del formulario público de contacto

El formulario no introduce por sí solo una ADR adicional. El uso de un port declarado por Application y un adaptador implementado por Infrastructure aplica la arquitectura hexagonal aceptada en ADR-002; no selecciona una tecnología de correo.

Permanecen pendientes y no deben tratarse como decisiones cerradas:

- Proveedor o servidor de correo.
- Dirección receptora configurable y nombres concretos de configuración.
- Estrategias de `From`, `Reply-To`, asunto, HTML y texto plano.
- Contrato definitivo, obligatoriedad de campos y catálogo final de tipos de solicitud.
- Política anti-spam, rate limiting, límites de tamaño, automatización abusiva, observabilidad y posible CAPTCHA si resulta necesario.
- Persistencia histórica o no de las solicitudes. El requisito actual solo exige procesarlas y enviarlas por correo; no aprueba una Entity o tabla `ContactRequest`.

Estas decisiones deberán evaluarse durante la implementación y, si alcanzan relevancia arquitectónica, registrarse mediante la siguiente ADR disponible.

## Cómo registrar una decisión futura

Una nueva ADR debe utilizar el siguiente número secuencial y contener título, estado, Contexto, Decisión y Consecuencias. Las decisiones reemplazadas se conservan y enlazan con su sucesora; no se reescribe el historial para ocultar cambios.

No registrar decisiones importantes basadas solo en una suposición. Primero deben ser acordadas y después reflejadas también en `ARCHITECTURE.md`, `README.md` o `CONVENTIONS.md` cuando corresponda.
