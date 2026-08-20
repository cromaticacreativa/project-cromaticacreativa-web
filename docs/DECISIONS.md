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

Construir un único backend desplegable como monolito modular dentro del monorepo. Todos los módulos pertenecerán a la misma aplicación y deployment y protegerán sus límites mediante APIs públicas explícitas entre módulos. Los módulos se alinean con Bounded Contexts por lenguaje y modelo de negocio, no por tablas o carpetas. No se introducirán microservicios.

> La identificación provisional de Bounded Contexts fue resuelta posteriormente por ADR-011. La decisión de monolito modular continúa vigente.

### Consecuencias

- Operación y despliegue iniciales más sencillos.
- Los límites modulares deben protegerse mediante estructura, revisión y tests cuando sea útil.
- Compartir proceso o base de datos no permite consumir `internal/` ni tablas de otro módulo.
- No se comparten Entities o Aggregate Roots entre módulos/Bounded Contexts.
- Una extracción futura solo se evaluaría ante necesidades demostradas y requeriría una nueva decisión.

## ADR-002 — Arquitectura hexagonal

**Estado:** Aceptada

### Contexto

El dominio y los casos de uso deben mantenerse independientes de NestJS, TypeORM, MySQL, Directus y otros detalles técnicos. También se necesita que los adaptadores puedan evolucionar sin trasladar lógica de negocio a infraestructura o HTTP.

### Decisión

Aplicar arquitectura hexagonal dentro de cada módulo. Domain es la capa más interna y Application depende de ella para orquestar el modelo. Presentation depende de Application. Infrastructure puede depender de Application y Domain para implementar ports, mappings y adaptadores correspondientes. Domain no depende de ninguna capa externa y Application no depende de Presentation o Infrastructure.

### Consecuencias

- Domain permanece libre de dependencias técnicas.
- Application sí utiliza Entities, Aggregates, Value Objects o Domain Services cuando el caso de uso lo requiere, pero no reimplementa sus invariantes.
- Presentation se limita a la traducción HTTP y delega casos de uso.
- Infrastructure concentra TypeORM y otros adaptadores.
- Las abstracciones genuinas de reglas de Domain pueden residir en Domain; los ports para recursos externos de casos de uso residen normalmente en Application.
- Las implementaciones técnicas se suministran mediante Dependency Injection, no se construyen desde Application.
- Requiere disciplina para no introducir abstracciones vacías ni saltarse capas.

## ADR-003 — CQRS + MediatR

**Estado:** Reemplazada por ADR-015

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

**Estado:** Reemplazada por ADR-016

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
- La topología de `DbContext`, schemas y migrations quedó resuelta posteriormente por ADR-013.

## ADR-005 — Directus como backoffice consumidor de ASP.NET Core

**Estado:** Reemplazada por ADR-018 y ADR-019

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

Construir el frontend público con React y TypeScript, HTML5 y CSS3, usando Vite como herramienta de construcción. El Cliente lo utiliza sin cuenta ni login. Se centralizará la comunicación HTTP mediante Fetch API o un cliente posteriormente aprobado, consumiendo exclusivamente la API REST NestJS.

El frontend se organizará conceptualmente con composición de aplicación, Pages, Features, Components, Hooks, Services/API clients, Types, Utils y Assets según existan responsabilidades reales. No replicará artificialmente las capas hexagonales del backend.

### Consecuencias

- Frontend y backend evolucionan como aplicaciones separadas dentro del monorepo.
- La UI depende de contratos HTTP, no del modelo interno del backend ni de Directus.
- Pages y Components componen UI; Features/Hooks encapsulan comportamiento React; Services centralizan NestJS. Los services no dependen de hooks.
- React no envía correo directamente ni conoce credenciales, destinatarios internos o detalles del proveedor.
- Cualquier framework adicional requiere aprobación y justificación.
- La estructura definitiva, versiones y herramientas de frontend quedan pendientes.

## ADR-007 — Contenido institucional estático en código

**Estado:** Aceptada

### Contexto

Misión, visión, descripción institucional general, eslóganes y textos corporativos de muy baja frecuencia de modificación no necesitan un ciclo editorial mediante CMS en la V1.

### Decisión

Mantener ese contenido en código. No crear una entidad `SiteSettings`, un módulo `Site` o tablas equivalentes únicamente para hacerlo administrable. Si Directus supera la PoC de ADR-018, podrá gestionar proyectos, multimedia, Clientes Corporativos, servicios e información de CompanyProfile conforme a ADR-019.

### Consecuencias

- El contenido institucional estático cambia mediante el flujo normal de código y deployment.
- Se evita modelado y persistencia innecesarios.
- Trasladarlo al CMS requerirá una necesidad real y la actualización de esta decisión.

## ADR-008 — Autenticación Directus → ASP.NET Core

**Estado:** Reemplazada por ADR-023

> Registro histórico de la etapa ASP.NET Core. ADR-023 conserva como pendiente la decisión equivalente para la arquitectura NestJS vigente; ADR-018 solo condiciona la adopción de Directus a una PoC y no resuelve su autenticación técnica.

### Contexto

Los Filter Hooks de Directus invocarán endpoints internos de ASP.NET Core para procesar mutaciones administrativas. Esa comunicación deberá autenticarse y autorizarse antes de producción.

### Decisión

El mecanismo técnico todavía no está decidido. No se adopta como definitiva ninguna estrategia —JWT, API Key, OAuth, mTLS u otra— hasta evaluar e implementar la integración.

### Consecuencias

- Los endpoints administrativos no deben exponerse en producción sin esta protección.
- La integración de Directus debe diseñarse admitiendo el mecanismo que se apruebe.
- La decisión se completará cuando existan requisitos operativos y una implementación verificable.

## ADR-009 — Directus conectado al esquema de dominio administrado por EF Core

**Estado:** Reemplazada por ADR-016 y ADR-018

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

**Estado:** Reemplazada por ADR-019

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

## ADR-011 — Bounded Contexts iniciales y ownership del modelo

**Estado:** Aceptada

### Contexto

La arquitectura documental inicial trataba Projects, CorporateClients, Services, Contact y Location como módulos conceptuales candidatos. El modelo de dominio posterior confirmó que proyectos y Clientes Corporativos forman una capacidad cohesiva de portafolio; que ubicación y datos corporativos de contacto pertenecen al perfil de la empresa; que las categorías comerciales tienen identidad y ciclo de vida dentro de Services; y que el procesamiento de solicitudes requiere un contexto separado de la información corporativa.

### Decisión

Definir cuatro Bounded Contexts iniciales:

- `Portfolio`: contiene los Aggregate Roots `Project` y `CorporateClient`; `ProjectMedia` es una Entity interna de `Project`.
- `Services`: contiene los Aggregate Roots `Service` y `ServiceCategory`.
- `CompanyProfile`: contiene el Aggregate Root `CompanyContactInformation`; `CompanyLocation` es una Entity interna y `SocialLink` un Value Object.
- `Contact`: contiene el Aggregate Root `ContactRequest` y se dedica al procesamiento del formulario.

> La clasificación de `CompanyLocation` como Entity fue reemplazada posteriormente por ADR-022. El ownership de CompanyProfile y la definición de los Bounded Contexts establecidos en esta ADR continúan vigentes.

No crear módulos independientes `Projects`, `CorporateClients`, `Location`, `Categories` o `Media`. Las relaciones entre contextos atraviesan contratos mínimos de `public/`: `Portfolio.Application` consulta `Services/public/`; `Contact.Application` consulta `Services/public/` y `CompanyProfile/public/`. Ningún Domain depende del Domain interno de otro contexto.

### Consecuencias

- Projects y CorporateClients se agrupan bajo el lenguaje y modelo de `Portfolio`.
- ServiceCategory pertenece a `Services` como Aggregate Root y no constituye un módulo Category.
- Ubicación, redes sociales, correo público y destinatario administrable del formulario pertenecen a `CompanyProfile`.
- `Contact` deja de administrar información corporativa y se concentra en crear y procesar `ContactRequest`.
- `ContactRequest` puede ser Aggregate Root sin que exista persistencia histórica o tabla en V1.
- Los conceptos con nombres similares en contextos distintos conservan representaciones propias; esta decisión no introduce Shared Kernel.
- Los cuatro contextos conservan arquitectura hexagonal, CQRS mediante la tecnología vigente y las reglas del monolito modular.

## ADR-012 — Fundación .NET y proyectos separados por capa

**Estado:** Reemplazada por ADR-014

### Contexto

La implementación inicial de Domain necesita una versión reproducible de .NET y límites de compilación que protejan la dirección de dependencias. Mantener todas las capas de un Bounded Context como carpetas de un único proyecto dejaría esos límites únicamente bajo convención.

### Decisión

Usar .NET 10 con target framework `net10.0` y fijar el SDK `10.0.302` mediante `global.json`. La solución se denomina `backend/CromaticaCreativa.sln` y el namespace raíz es `CromaticaCreativa.Modules`.

Cada Bounded Context contiene cuatro proyectos independientes:

- `CromaticaCreativa.Modules.{Context}.Domain`
- `CromaticaCreativa.Modules.{Context}.Application`
- `CromaticaCreativa.Modules.{Context}.Infrastructure`
- `CromaticaCreativa.Modules.{Context}.Presentation`

Las dependencias permitidas son `Application → Domain`, `Presentation → Application` e `Infrastructure → Application/Domain`. Una referencia se agrega únicamente cuando exista código que la necesite. Quedan prohibidas `Domain → Application/Infrastructure/Presentation` y `Application → Infrastructure/Presentation`.

No se crea todavía un proyecto `Contracts` o `Public`: la frontera pública entre Bounded Contexts se materializará cuando una historia de usuario tenga un consumidor real.

### Consecuencias

- Los límites de capa pueden protegerse mediante referencias entre `.csproj` y no solo por carpetas.
- Los cuatro contextos aportan 16 proyectos a la solución.
- `backend/Directory.Build.props` centraliza target framework, nullable reference types e implicit usings.
- En la fundación inicial, solo los cuatro proyectos Domain contienen código funcional.
- Application, Infrastructure y Presentation pueden existir sin clases placeholder ni referencias anticipadas.
- Introducir contratos públicos o referencias entre capas requiere una necesidad concreta y revisión de la dirección de dependencias.

## ADR-013 — Modelo de persistencia separado y topología por Bounded Context

**Estado:** Reemplazada por ADR-016

### Contexto

Los modelos Domain ya implementados protegen invariantes y no deben adoptar la forma del esquema relacional ni depender de EF Core. La persistencia necesita, en cambio, tablas normalizadas, constraints verificables, nombres estables para PostgreSQL/Directus y ownership inequívoco de contexts y migrations. También debe preservarse el aislamiento entre `Portfolio`, `Services`, `CompanyProfile` y `Contact` sin introducir un `DbContext` global o FKs entre implementaciones de módulos.

### Decisión

Usar exactamente Entity Framework Core `10.0.10`, `Microsoft.EntityFrameworkCore.Design` `10.0.10`, Npgsql EF provider `10.0.3` y la herramienta local `dotnet-ef` `10.0.10`.

El modelo de Persistence será distinto del modelo Domain. Infrastructure contiene clases técnicas con sufijo `Model`, configuradas mediante `IEntityTypeConfiguration<T>`, y mappers que transforman en ambos sentidos usando las APIs públicas de Domain. Domain no contiene atributos, converters, tipos ni referencias de EF Core/Npgsql.

La topología persistente es:

- `PortfolioDbContext` posee el schema `portfolio`, las tablas `project`, `media` y `corporate_client`, sus migrations y `portfolio.__ef_migrations_history`;
- `ServicesDbContext` posee el schema `services`, las tablas `service` y `category`, sus migrations y `services.__ef_migrations_history`;
- `CompanyProfileDbContext` posee el schema `company_profile`, las tablas `company_profile`, `phone`, `email`, `location` y `social_link`, sus migrations y `company_profile.__ef_migrations_history`;
- `Contact` no tiene `DbContext`, Persistence Model, migration ni tabla para `ContactRequest` mientras no exista un requisito de historial.

Schemas, tablas y columnas usan nombres singulares `snake_case`; constraints e índices usan nombres explícitos con prefijos `pk_`, `fk_`, `uq_`, `ck_` e `ix_`. EF Core Migrations conserva la autoridad estructural y Directus se limitará a introspeccionar y operar sobre los schemas aprobados.

Solo existen FKs dentro del mismo Bounded Context. `portfolio.project.service_id` y `category_id` son UUID opacos que representan referencias lógicas a Services, sin FK, navegación EF, JOIN ni dependencia Infrastructure → Infrastructure. Application validará existencia, pertenencia y estado mediante contratos públicos cuando se implementen los casos de uso.

`CorporateClient → Project` y `Service → Category` usan `RESTRICT`; `Project → Media` y `CompanyProfile → Phone/Email/Location/SocialLink` usan `CASCADE`. La portada se representa con `media.is_cover` y un índice único parcial por Project. `CompanyProfile` usa `singleton_key = 1` con `UNIQUE` para garantizar una única raíz.

### Consecuencias

- Domain continúa compilando sin EF Core, Npgsql o PostgreSQL y no se modifica para facilitar materialización.
- Cada Infrastructure referencia exclusivamente el Domain del mismo contexto para sus mappers; no se requieren referencias a Application en esta fase.
- Los contexts y migrations pueden evolucionar independientemente y no comparten tabla global de historial.
- PostgreSQL garantiza integridad estructural interna, pero no puede garantizar las referencias lógicas Portfolio → Services; esa coherencia es una precondición obligatoria de futuros casos de uso.
- Un CorporateClient o Service referenciado no se elimina físicamente por cascada; los estados `HIDDEN` e `INACTIVE` cubren su retiro de publicación.
- El modelo relacional de CompanyProfile puede separar filas técnicas aunque Domain use Value Objects sin identidad; los IDs técnicos no se convierten en identidades de negocio.
- Directus deberá recibir acceso a los tres schemas durante su integración, sin permisos para alterar el Data Model.
- Las migrations iniciales existen y sus scripts SQL pueden generarse sin una base activa; aplicarlas requiere una conexión PostgreSQL configurada mediante `CROMATICA_DB_CONNECTION_STRING`.

## ADR-014 — Node.js 22, TypeScript y NestJS sustituyen la fundación objetivo .NET

**Estado:** Aceptada

> La migración física, entonces pendiente, fue autorizada y completada posteriormente. ADR-020 registra la estructura resultante.

### Contexto

La fundación física existente usa .NET, pero la arquitectura objetivo del producto se redefine para ajustarse al stack y al entorno de despliegue aprobados. El cambio documental no autoriza eliminar ni migrar el código heredado.

### Decisión

Usar Node.js 22, TypeScript y NestJS para la API REST del monolito modular. NestJS proporcionará el host, módulos, controllers y Dependency Injection. La migración desde `backend/CromaticaCreativa.sln` será una tarea posterior explícita.

### Consecuencias

- .NET, C#, ASP.NET Core y los `.csproj` dejan de ser la arquitectura objetivo.
- El código .NET existente permanece como estado físico heredado hasta una migración autorizada.
- No se fijan versiones de NestJS o TypeScript antes de implementar y verificar dependencias reales.
- Controllers traducen HTTP y delegan; no contienen reglas de negocio.

## ADR-015 — `@nestjs/cqrs` sustituye MediatR

**Estado:** Aceptada

### Contexto

La separación entre acciones y lecturas continúa siendo útil, pero el dispatcher debe pertenecer al stack NestJS objetivo.

### Decisión

Usar `@nestjs/cqrs`, `CommandBus`, `QueryBus`, `CommandHandler` y `QueryHandler`. Los Commands expresan acciones o efectos y las Queries son lecturas sin efectos. Solo se crearán casos de uso reales.

### Consecuencias

- MediatR deja de ser parte del objetivo.
- Presentation despacha a Application mediante los buses de NestJS.
- El formulario se modela conceptualmente como `SubmitContactRequestCommand`.
- CQRS no implica Event Sourcing y no autoriza CRUD ceremonial.

## ADR-016 — TypeORM y MySQL sustituyen EF Core y PostgreSQL

**Estado:** Aceptada

> La topología que esta ADR dejó abierta fue resuelta por ADR-020.

### Contexto

El backend objetivo necesita persistencia relacional compatible con el entorno seleccionado, manteniendo Domain independiente del ORM y conservando evolución estructural versionada.

### Decisión

Usar MySQL como base relacional y TypeORM en Infrastructure. El Persistence Model será distinto del Domain Model; las entidades TypeORM no serán Aggregate Roots, Entities o Value Objects de Domain. TypeORM Migrations será la autoridad estructural y `synchronize: true` estará prohibido en producción.

No se decide todavía la topología de `DataSource`, la existencia de múltiples DataSources, schemas MySQL, nombres de variables de entorno, convención física completa ni FKs entre Bounded Contexts.

### Consecuencias

- EF Core, Npgsql, PostgreSQL, los tres `DbContext` y sus schemas/migrations quedan como estado histórico y físico heredado.
- Los mappings Domain ↔ Persistence viven en Infrastructure.
- Cada cambio persistente requiere una migration revisada con constraints, índices, cardinalidades y delete behaviors apropiados.
- Directus, si se adopta, se adapta a tablas creadas externamente y no controla el Data Model del dominio.
- `ContactRequest` continúa sin persistencia histórica aprobada.

## ADR-017 — Deployment objetivo en Hostinger Business Web Hosting

**Estado:** Aceptada

### Contexto

Cromática Creativa dispone de un plan de hosting que debe evaluarse antes de introducir otra plataforma operativa.

### Decisión

El deployment objetivo se evaluará sobre el **Hostinger Business Web Hosting existente**. Esta decisión no introduce un VPS ni afirma límites comerciales o capacidades no verificadas.

### Consecuencias

- Node.js 22, NestJS, MySQL y la operación del proceso deben validarse en el entorno real.
- No se documentan límites comerciales inestables como garantías arquitectónicas.
- Una plataforma alternativa requeriría evidencia y una ADR futura.

## ADR-018 — Directus provisional sujeto a PoC

**Estado:** Pendiente

### Contexto

Directus podría evitar construir un panel administrativo. HU09 autorizó incorporarlo localmente y comprobar su autenticación nativa, pero su ejecución, persistencia, extensions, uploads y comportamiento operativo en el hosting existente no han sido validados.

### Decisión

Mantener Directus como candidato provisional. Antes de adoptarlo, ejecutar la PoC definida en `ARCHITECTURE.md` y `ROADMAP.md` sobre el Hostinger Business Web Hosting existente. No afirmar deployment funcional ni soporte oficial. Si la PoC falla, reconsiderar el CMS mediante una ADR futura sin seleccionar ahora una alternativa.

Como evidencia estructural de HU09, Directus `12.3.0` está incorporado en `infrastructure/CMS/Directus/` como aplicación Node.js `>=22` independiente. Su configuración usa `DB_HOST`, `DB_PORT` y `DB_DATABASE` para apuntar a la misma MySQL que TypeORM configura con `MYSQL_HOST`, `MYSQL_PORT` y `MYSQL_DATABASE`; TypeORM conserva ownership de las diez tablas de negocio y el bootstrap oficial de Directus conserva ownership de `directus_*`. El primer Administrador se aprovisiona con `ADMIN_EMAIL`/`ADMIN_PASSWORD`, la autenticación administrativa pertenece a Directus y no se agrega configuración que habilite su registro público, deshabilitado por defecto. Las comprobaciones dependientes de una instancia MySQL se registran separadamente en `ROADMAP.md` según evidencia real.

### Consecuencias

- Directus se considera incorporado/configurado para HU09, pero no adoptado ni aprobado definitivamente para producción.
- Deben verificarse Node.js 22, MySQL, tablas internas, Data Studio, introspección, hooks, NestJS, aprobación/rechazo, payload canónico, escritura única, uploads, extensions y supervivencia tras redeploy.
- Autenticación Directus → NestJS permanece pendiente en ADR-023; permisos y operación también continúan abiertos.
- React nunca consumirá Directus directamente.

## ADR-019 — Filter Hook bloqueante y escritor final único

**Estado:** Aceptada

### Contexto

Las mutaciones administrativas deben atravesar Application y Domain sin que NestJS y el CMS persistan dos veces la misma operación.

### Decisión

Si Directus supera la PoC, cada mutación administrativa se interceptará antes de persistir mediante un Filter Hook bloqueante. El Hook llamará a un endpoint interno NestJS, que despachará un Command con `CommandBus`. Application podrá leer estado mediante un port TypeORM, invocará Domain y devolverá error, aprobación o payload canónico. Directus realizará el único `INSERT`, `UPDATE` o `DELETE` final.

### Consecuencias

- El Command administrativo no ejecuta la persistencia final de esa misma mutación.
- Deben probarse bloqueo, rechazo, aprobación, canonicalización y ausencia de doble escritura.
- Las lecturas administrativas ordinarias no requieren NestJS.
- Si ADR-018 no se valida, este mecanismo deberá revisarse junto con la futura decisión de CMS.

## ADR-020 — Estructura hexagonal física y ownership modular de persistencia

**Estado:** Reemplazada por ADR-021

### Contexto

La primera migración física a TypeScript agrupó conceptos de Domain, introdujo un `shared/domain`, concentró configuración y migrations en `src/database` y materializó un frontend antes de la fase prevista. Aunque el comportamiento principal y el esquema MySQL eran reutilizables, esa disposición debilitaba los límites de Bounded Context, confundía infraestructura técnica global con ownership persistente y no expresaba las cuatro capas aprobadas.

### Decisión

Cada Bounded Context vivía directamente bajo el directorio fuente y materializaba `Domain`, `Application`, `Infrastructure` y `Presentation`. Domain separaba abstracciones, Aggregates, Entities, ValueObjects, Enums y Exceptions; Application separaba Ports, Validations, Commands y Queries; Infrastructure separaba Persistence y Adapters; Presentation separaba Controllers y Mappers. Las carpetas sin consumidor real se conservaban solo mediante `.gitkeep`, sin artefactos funcionales ficticios.

No existe Shared Kernel, `shared/domain` ni una capa global `src/database`. Cada contexto mantiene sus propios Value Objects y puede usar abstracciones locales de Domain para igualdad o UUID cuando exista duplicación interna real. `Commons/DTOs` queda limitado a DTOs compartidos por varios módulos y permanece vacío hasta que exista un contrato real.

Los Persistence Models, Mappers, Configurations y Migrations pertenecen al módulo propietario:

- Portfolio controla `corporate_client`, `project` y `media`;
- Services controla `service` y `category`;
- CompanyProfile controla `company_profile`, `phone`, `email`, `location` y `social_link`;
- Contact no controla tabla ni migration funcional para `ContactRequest`.

La aplicación usa una única base MySQL y un único DataSource técnico en `backend/src/Infrastructure/Persistence/TypeOrmDataSource.ts`. La configuración global ensambla los modelos y migrations publicados por la Infrastructure de cada módulo, pero no adquiere su ownership. Los módulos registran únicamente sus propios modelos con `TypeOrmModule.forFeature(...)`.

Los archivos principales del backend usan PascalCase y un concepto principal por archivo. Los mensajes propios de Domain y Application se escriben en español. El frontend React + TypeScript + Vite permanece aprobado como objetivo, pero su materialización se pospone a una tarea posterior; no existe `frontend/` en el estado versionable resultante.

### Consecuencias

- Los cuatro límites hexagonales son visibles y auditables en el árbol.
- La antigua carpeta de abstracciones Domain no se convierte en depósito de ports técnicos; `Application/Ports` define necesidades externas y Infrastructure las implementa.
- Separar migrations por ownership no crea múltiples conexiones ni múltiples DataSources.
- No se crean Commands, Queries, Handlers, ports, validaciones Application, controllers o DTOs sin consumidor real.
- La portada única de Project continúa protegida dentro de Portfolio mediante `cover_marker`, columna generada nullable que no depende de `project_id`, y `UNIQUE (project_id, cover_marker)`; así `fk_media_project` conserva `ON DELETE CASCADE` bajo MySQL 8.4.
- React/Vite, sus dependencias y su estructura se incorporarán en una fase posterior con `app`, `pages`, `features`, `components`, `hooks`, `services`, `types`, `utils` y `assets` según responsabilidades reales.

## ADR-021 — Módulos con capas nominales, Commons locales y composición de Contact

**Estado:** Aceptada

### Contexto

La estructura directa por contexto y capa no hacía explícito el nombre del contexto en cada frontera física y mantenía un Commons global sin consumidor. Además, las clases base de Value Objects estaban bajo la antigua carpeta de abstracciones Domain, aunque esa carpeta debía expresar contratos, y `ContactRequest` repetía directamente los datos personales sin una Entity que representara al remitente de la solicitud.

### Decisión

Cada Bounded Context vive en `backend/src/modules/{Context}` y contiene `{Context}.Domain`, `{Context}.Application`, `{Context}.Infrastructure`, `{Context}.Presentation`, `{Context}.Commons` y `{Context}Module.ts`. `Commons` es local al módulo y no es una quinta capa hexagonal. No existe un Commons global.

`{Context}.Domain/Abstract` contiene exclusivamente interfaces reales con prefijo `I`. Las clases base locales `ScalarValueObject` y `UuidValueObject` viven en `Domain/ValueObjects/Base`. `ICreateProjectParameters` e `ICreateContactRequestParameters` son los únicos contratos Domain materializados en esa carpeta; los contextos sin contrato real conservan solo `.gitkeep`.

Los DTOs de persistencia son tipos planos, sin decoradores ni comportamiento, en `{Context}.Commons/DTOs`. Los diez Persistence Models TypeORM pueden implementar esos contratos y los mappers los aceptan como entrada. Domain no depende de Commons.

En Contact, `Client` es una Entity interna y efímera compuesta por `ClientId` generado en Domain, `PersonName`, empresa opcional normalizada, `EmailAddress` y `PhoneNumber`. No es una cuenta, el actor público como identidad persistida ni un `CorporateClient`; no se almacena en MySQL. `ContactRequest` compone `Client`, `TipoSolicitud`, una propiedad `requestedService` de tipo `RequestedServiceReference` y mensaje opcional normalizado. `TipoSolicitud` admite únicamente `SOLICITUD_INFORMACION` y `SOLICITUD_SERVICIO`.

> La generación de `ClientId` dentro de Domain dejó de ser vigente en una corrección posterior de la fundación: el ID continúa siendo efímero y no persistido, pero Application/composition debe proporcionar su UUID al construir `Client`. El ownership y la composición definidos por esta ADR permanecen vigentes.

`Contact.Presentation/DTOs/SubmitContactRequestDto.ts` existe como tipo plano sin decoradores. El flujo objetivo será React → DTO → Presentation → `SubmitContactRequestCommand` → `CommandBus` → Contact.Application → `IServicesReadPort`/`ICompanyProfileReadPort`/`IEmailSenderPort` → `Client` + `ContactRequest` → `ContactEmailDto` → adapter SMTP. En el estado actual no se materializan Command, Handler, ports, `ContactEmailDto`, adapter, controller o endpoint porque todavía no existe el caso de uso consumidor.

### Consecuencias

- Las cuatro fronteras hexagonales y sus contratos locales son auditables por ruta y nombre.
- `Abstract` no mezcla clases base con interfaces; todas las interfaces Domain/Application usan prefijo `I`.
- Los DTOs de persistencia desacoplan mapper y clase TypeORM sin filtrarse a Domain.
- Portfolio, Services y CompanyProfile conservan exactamente diez modelos, cinco mappers, tres migrations y un único DataSource.
- Contact continúa sin Persistence Models, tabla, migration, adapter de correo o puertos artificiales.
- El frontend y los endpoints permanecen sin implementar.

## ADR-022 — Colecciones públicas y ubicación sin identidad en CompanyProfile

**Estado:** Aceptada

### Contexto

CompanyProfile modelaba un único teléfono, un teléfono especial de WhatsApp y un único correo público. También otorgaba identidad Domain propia a CompanyLocation. Ese modelo no representaba la necesidad de publicar múltiples teléfonos y correos, duplicaba WhatsApp fuera de los enlaces sociales y añadía una identidad sin significado de negocio a la ubicación.

### Decisión

`CompanyContactInformation` administra colecciones sin duplicados de `PhoneNumber`, `EmailAddress` públicos y `SocialLink`. `ContactRequestRecipientEmail` permanece como un único correo operativo separado de la colección pública. WhatsApp es un `SocialLink` cuya red puede ser `WhatsApp`; no es un tipo de teléfono. Cada network social es única dentro del Aggregate mediante comparación normalizada.

`CompanyLocation` es un Value Object compuesto por `Address` y `GeoCoordinates` obligatorias. El Aggregate puede no tener ubicación, reemplazarla completa o eliminarla, pero no existe identidad Domain para Location.

En MySQL, `company_profile` contiene `contact_request_recipient_email`. Las tablas `phone` y `email` contienen filas públicas con UUID técnico, `display_order` y unicidad por valor dentro de la raíz. `social_link` mantiene UUID técnico, orden y network única. `location` usa `company_profile_id` como PK/FK y exige address, latitude y longitude. Como la migration inicial no se ha aplicado a una instancia MySQL real, se corrige directamente sin crear una migration compensatoria.

`CompanyProfile.Commons/DTOs` contiene los contratos planos de persistencia. `CompanyProfile.Presentation` conserva solo Controllers y Mappers; no se inventan DTOs de transporte, controllers o endpoints sin consumidor.

### Consecuencias

- Domain no contiene Phone, Email o SocialLink Entities ni IDs técnicos de fila.
- El destinatario interno nunca se publica automáticamente como email público.
- WhatsApp comparte las reglas de unicidad y persistencia de los demás SocialLinks.
- Los mappers preservan IDs técnicos de phone, email y social_link cuando permanece el mismo valor lógico.
- CompanyProfile conserva cinco Persistence Models y una única ubicación física por raíz.

## ADR-023 — Autenticación técnica Directus → NestJS

**Estado:** Pendiente

### Contexto

Si Directus supera la PoC de ADR-018, sus Filter Hooks bloqueantes deberán llamar endpoints internos NestJS para procesar mutaciones administrativas conforme a ADR-019. Esa comunicación técnica necesitará autenticación y autorización antes de producción.

### Decisión

Todavía no se selecciona un mecanismo. Esta ADR no adopta API key, JWT, OAuth, mTLS, Basic Auth, sesiones ni proveedor alguno.

La decisión se completará únicamente después de superar la PoC de Directus, conocer las restricciones reales del Hostinger Business Web Hosting existente y definir amenazas y requisitos operativos verificables.

### Consecuencias

- Ningún endpoint administrativo interno se considera listo para producción mientras esta ADR permanezca pendiente.
- No se hardcodearán secretos en código, configuración versionada, hooks ni contratos.
- El mecanismo futuro deberá admitir rotación de credenciales y mínimo privilegio.
- Si Directus no se adopta, esta ADR deja de ser necesaria junto con esa integración.

## Decisiones abiertas del formulario público de contacto

El formulario no introduce por sí solo una ADR adicional. El uso de un port declarado por Application y un adaptador implementado por Infrastructure aplica la arquitectura hexagonal aceptada en ADR-002; no selecciona una tecnología de correo.

Permanecen pendientes y no deben tratarse como decisiones cerradas:

- Proveedor o servidor de correo.
- Configuración técnica y dirección concreta de `From`.
- Asunto, HTML y texto plano.
- Contrato HTTP definitivo y obligatoriedad de campos. El catálogo Domain de `TipoSolicitud` ya está cerrado con dos valores.
- Política anti-spam, rate limiting, límites de tamaño, automatización abusiva, observabilidad y posible CAPTCHA si resulta necesario.
- Persistencia histórica o no de las solicitudes. `ContactRequest` es Aggregate Root, pero el requisito actual no aprueba una tabla ni almacenamiento histórico.

El `To` ya no es una configuración de Infrastructure: corresponde a `ContactRequestRecipientEmail`, administrado en `CompanyProfile`. El `Reply-To` corresponde al `EmailAddress` validado del solicitante. El `From` sí pertenece a la configuración técnica del proveedor en Infrastructure.

Estas decisiones deberán evaluarse durante la implementación y, si alcanzan relevancia arquitectónica, registrarse mediante la siguiente ADR disponible.

## Cómo registrar una decisión futura

Una nueva ADR debe utilizar el siguiente número secuencial y contener título, estado, Contexto, Decisión y Consecuencias. Las decisiones reemplazadas se conservan y enlazan con su sucesora; no se reescribe el historial para ocultar cambios.

No registrar decisiones importantes basadas solo en una suposición. Primero deben ser acordadas y después reflejadas también en `ARCHITECTURE.md`, `README.md` o `CONVENTIONS.md` cuando corresponda.
