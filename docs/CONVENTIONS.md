# Convenciones

Estas convenciones definen el punto de partida para backend C#/.NET y frontend TypeScript/React. Se aplicarán junto con los patrones que surjan de la implementación real. Cualquier excepción debe ser intencional, consistente y justificable.

## Principios generales

- Usar nombres que expresen lenguaje de negocio y responsabilidad.
- Mantener términos técnicos naturales en inglés: `Command`, `Query`, `Handler`, `Domain`, `Application`, `Infrastructure`, `Presentation`.
- Preferir una clase o función pequeña y explícita a una abstracción genérica prematura.
- Organizar por módulo y feature antes que por tipo técnico global.
- No compartir tipos internos entre módulos ni filtrar modelos de persistencia a contratos.
- Seguir el formato automatizado que se configure en el repositorio; las herramientas concretas aún no están seleccionadas.

## Terminología oficial

- **Cliente**: actor público que consulta contenido y puede enviar el formulario de contacto mediante React, sin cuenta, registro, login, perfil, roles ni permisos persistidos.
- **Administrador**: personal autorizado de Cromática Creativa que accede a Directus mediante credenciales administrativas.
- `Portfolio`: Bounded Context del trabajo realizado; contiene `Project` y `CorporateClient`.
- `Services`: Bounded Context de la oferta comercial; contiene `Service` y `ServiceCategory`.
- `CompanyProfile`: Bounded Context de información corporativa administrable, ubicación y redes sociales.
- `Contact`: Bounded Context dedicado exclusivamente a procesar solicitudes de Clientes.
- **ASP.NET Core API**: único backend consumido por React.
- **Directus**: CMS administrativo; no es la API pública ni propietario del esquema.

No alternar Cliente con otros nombres para el actor público. No modelar Cliente o Administrador como identidades autenticadas de ASP.NET Core en la V1.

## C# y .NET

Seguir las convenciones estándar de .NET:

- `PascalCase` para namespaces, clases, records, structs, enums, métodos y propiedades públicas.
- `camelCase` para parámetros y variables locales.
- `_camelCase` para campos privados cuando sean necesarios.
- Prefijo `I` para interfaces (`IProjectReadStore`) de acuerdo con la convención de .NET.
- Un tipo principal por archivo y nombre de archivo igual al tipo principal.
- Habilitar y respetar nullable reference types cuando la fundación técnica lo establezca.
- Usar `async`/`await` y sufijo `Async` según las guías .NET y el contrato real; los Handlers de MediatR conservan la firma definida por la librería.
- Propagar `CancellationToken` en I/O y operaciones cancelables.

El namespace raíz es `CromaticaCreativa.Modules`. Los namespaces siguen `CromaticaCreativa.Modules.{BoundedContext}.{Layer}` y agregan el área cohesiva cuando corresponde, por ejemplo `CromaticaCreativa.Modules.Portfolio.Domain.ValueObjects`.

## Módulos y carpetas

Patrón físico aprobado:

```text
backend/modules/{BoundedContext}/
├── CromaticaCreativa.Modules.{BoundedContext}.Domain/
├── CromaticaCreativa.Modules.{BoundedContext}.Application/
├── CromaticaCreativa.Modules.{BoundedContext}.Infrastructure/
└── CromaticaCreativa.Modules.{BoundedContext}.Presentation/
```

- El nombre del módulo representa una capacidad de negocio y se expresa en PascalCase en C#.
- Los casos de uso se agrupan uno por carpeta: `queries/GetProjects/` o `commands/PublishProject/`, no en archivos masivos de mensajes o Handlers.
- Co-localizar con el caso de uso sus DTOs o validadores exclusivos cuando mejore la cohesión; no crear archivos ceremoniales ni una carpeta vacía por cada categoría posible.
- Crear solo carpetas que contengan responsabilidades reales.
- Los contratos públicos entre módulos se materializan solo cuando un caso de uso tenga un consumidor real; no se crea anticipadamente un proyecto `Contracts` o `Public`.
- La implementación propia de otro Bounded Context nunca se referencia directamente.
- Los módulos corresponden a los cuatro Bounded Contexts aprobados: `Portfolio`, `Services`, `CompanyProfile` y `Contact`.
- Definir un Bounded Context por lenguaje y modelo coherentes; no por tabla, Entity o carpeta.
- No compartir Entities o Aggregate Roots entre módulos/Bounded Contexts.
- Las referencias permitidas son `Application → Domain`, `Presentation → Application` e `Infrastructure → Application/Domain`, pero solo se agregan cuando código real las necesita.
- Están prohibidas `Domain → Application/Infrastructure/Presentation` y `Application → Infrastructure/Presentation`.

Las carpetas de Bounded Context, proyecto, capa y áreas de Domain usan PascalCase. La solución física es `backend/CromaticaCreativa.sln`; `backend/Directory.Build.props` aplica `net10.0`, nullable reference types e implicit usings a todos los proyectos, y `global.json` fija el SDK `10.0.302`.

## Commands

- Nombrar con verbo imperativo e intención: `PublishProjectCommand`, `UpdateCompanyContactInformationCommand`.
- Sufijo obligatorio `Command`.
- Preferir un record inmutable si encaja con los patrones adoptados.
- Incluir solo datos de entrada del caso de uso; no incluir `DbContext`, servicios, implementaciones concretas, Entities o tipos de Infrastructure, Directus, SMTP ni detalles de proveedor.
- Un Command representa intención de cambio y puede devolver un resultado explícito cuando sea útil.
- Un Command puede producir un efecto externo requerido por el caso de uso, como enviar correo mediante un port; el Handler no depende del proveedor técnico.
- Las validaciones de entrada, existencia, precondiciones y coherencia del caso de uso pertenecen a Application; las invariantes propias del modelo permanecen en Domain.
- Las mutaciones administrativas interceptadas por Filter Hooks se modelan como Commands de ASP.NET Core.
- Un Command puede devolver error, aprobación o un payload canónico para que Directus continúe la operación.
- El Handler no ejecuta con EF Core la persistencia final de la misma mutación que Directus realizará.
- No crear Commands para mantener simetría o completar CRUD artificial ajeno al ERS.
- CQRS separa lectura y escritura cuando ambas existen; no exige Commands y Queries en cada módulo.

## Queries

- Nombrar por resultado o búsqueda: `GetProjectsQuery`, `GetProjectByIdQuery`.
- Sufijo obligatorio `Query`.
- No producir efectos secundarios observables.
- Nunca enviar correos ni ejecutar otras acciones externas propias de un Command.
- No escribir datos ni mutar Aggregates.
- Incluir filtros, paginación y orden solo cuando formen parte del contrato.
- Proyectar a DTOs apropiados; no devolver Entities ni `IQueryable` fuera de Infrastructure.
- En la V1, las operaciones públicas serán principalmente Queries mediante ASP.NET Core y EF Core.
- Usar un read port con proyección de Infrastructure; no reconstruir un Aggregate si la lectura solo requiere un DTO.
- Las consultas administrativas ordinarias las realiza Directus directamente sobre PostgreSQL y no requieren Queries de Application.

## Handlers

- Usar el nombre del mensaje más el sufijo `Handler`: `GetProjectsQueryHandler`, `PublishProjectCommandHandler`.
- Un Handler atiende un caso de uso.
- Recibir dependencias por constructor mediante Dependency Injection.
- Coordinar el caso de uso y delegar reglas a Domain y detalles técnicos a ports.
- Invocar comportamiento de Domain cuando el caso de uso involucra Entities, Aggregates, Value Objects o Domain Services; Application sí utiliza Domain.
- No reproducir dentro del Handler condiciones que sean invariantes de Domain ni modificar el estado interno de un Aggregate evitando su API.
- No utilizar directamente la implementación interna de otro módulo.
- Recibir dependencias técnicas por Dependency Injection y no construir con `new` un `DbContext`, cliente de Directus, adaptador, gateway o repositorio concreto.
- Permitir la creación de objetos de Domain cuando un constructor, factory o método de creación conserva las invariantes.
- Propagar `CancellationToken`.

## DTOs y contratos

- Usar sufijo `Dto` de forma consistente: `ProjectSummaryDto`.
- Nombrar DTOs por intención y contexto, no como copia genérica de una tabla.
- Los DTOs son estructuras de transferencia sin lógica de negocio.
- Usar nombres contextuales como `CreateProjectRequestDto`, `ProjectResponseDto` o equivalentes consistentes con la convención que se adopte.
- Mapear Request DTO → Command/Query y Domain/proyección → Response DTO.
- Un Request DTO del formulario no se convierte automáticamente en Entity persistente ni se reutiliza directamente como modelo de Domain.
- No incluir ni exponer Entities de Domain, tipos EF Core, secretos o campos que el consumidor no necesite.
- Distinguir cuando sea necesario entre DTOs de Application, contratos HTTP y DTOs de `public/` entre módulos.
- Versionar o evolucionar contratos deliberadamente cuando existan consumidores.

## Entities y Aggregate Roots

- Usar sustantivos singulares: `Project`, `CorporateClient`, `Service`, `ServiceCategory`, `CompanyContactInformation`, `CompanyLocation` y `ContactRequest`.
- Una Entity requiere identidad y ciclo de vida; no convertir automáticamente cada tabla o DTO en Entity.
- Un Aggregate define un límite de consistencia y su Root protege las invariantes internas; no crear un Aggregate Root por tabla.
- Mantener identidad, comportamiento e invariantes dentro de Domain.
- Evitar modelos anémicos si existen reglas reales, pero no inventar comportamiento.
- Proteger estados inválidos mediante constructores, factories o métodos de comportamiento según el patrón acordado.
- No decorar Domain con atributos de EF Core, ASP.NET Core o Directus.
- Modificar un Aggregate Root a través de su API de dominio.
- Evitar setters públicos o manipulación desde Handlers que permitan saltarse invariantes.

Clasificación aprobada:

| Bounded Context | Aggregate Roots | Entities internas |
| --- | --- | --- |
| `Portfolio` | `Project`, `CorporateClient` | `ProjectMedia` dentro de `Project` |
| `Services` | `Service`, `ServiceCategory` | — |
| `CompanyProfile` | `CompanyContactInformation` | `CompanyLocation` |
| `Contact` | `ContactRequest` | — |

- `ProjectMedia` no existe independientemente de `Project`; su colección se modifica mediante el Aggregate Root.
- `CompanyLocation` pertenece a `CompanyContactInformation`; no crear un módulo `Location`.
- `ContactRequest` es Aggregate Root aunque su persistencia histórica no esté aprobada. Aggregate Root no equivale automáticamente a tabla.
- `ServiceCategory` es Aggregate Root con identidad y ciclo de vida propios; no crear un módulo `Categories`.

## Value Objects

- Nombrar por concepto del modelo, por ejemplo `ProjectTitle`, no por representación genérica como `StringWrapper`.
- Ser inmutables y validar sus invariantes al crearse.
- Implementar igualdad por valor.
- No permitir instancias inválidas con la expectativa de validarlas después en Application.
- No crear Value Objects para cada tipo primitivo si no protegen una regla o mejoran el modelo.
- `ProjectPeriod` deriva `TotalDays` de `EndDate - StartDate` y protege `EndDate >= StartDate`; no persistir conceptualmente `TotalDays` como valor independiente.
- `SocialLink` es un Value Object inmutable compuesto por `SocialNetwork` y `ExternalUrl`; no agregar `SocialLinkId` sin una necesidad de identidad.
- `ProjectServiceReference` y `ProjectCategoryReference` pertenecen a `Portfolio.Domain`; no usan directamente tipos de `Services.Domain`.
- `RequestedServiceReference` pertenece a `Contact.Domain`.
- Los Value Objects aprobados se mantienen por Bounded Context aunque compartan nombres; no crear un Shared Kernel por coincidencia nominal.

### Value Objects por contexto

- `Portfolio`: `ProjectId`, `ProjectMediaId`, `CorporateClientId`, `ProjectTitle`, `CorporateClientName`, `MediaReference`, `DisplayOrder`, `ProjectPeriod`, `ProjectServiceReference`, `ProjectCategoryReference`.
- `Services`: `ServiceId`, `ServiceName`, `ServiceCategoryId`, `ServiceCategoryName`, `MediaReference`, `DisplayOrder`.
- `CompanyProfile`: `CompanyContactInformationId`, `CompanyLocationId`, `EmailAddress`, `PhoneNumber`, `Address`, `GeoCoordinates`, `ExternalUrl`, `SocialLink`.
- `Contact`: `ContactRequestId`, `PersonName`, `EmailAddress`, `PhoneNumber`, `RequestedServiceReference`.

Esta lista define el modelo conceptual; no obliga a crear clases vacías o persistencia antes de que exista implementación.

## Convenciones del modelo aprobado

- `Project` usa `PublicationStatus`, conceptualmente `Draft`/`Published`; no reutilizar `Active`/`Inactive` para publicación.
- `CorporateClient` conserva `VisibilityStatus` con semántica propia.
- `Service` usa `ServiceStatus` y `ServiceCategory` usa `ServiceCategoryStatus`, ambos con `Active`/`Inactive`.
- No crear un enum de estado universal para compartir estas semánticas.
- Cada `ServiceCategory` referencia exactamente un `Service` mediante `ServiceId` o equivalente dentro de `Services`.
- `ServiceCategory.ReferenceImage` nombra una imagen ilustrativa del tipo de trabajo. `ProjectMedia` nombra multimedia real de un Project; no intercambiar ambos conceptos.
- `CompanyContactInformation` administra `ContactRequestRecipientEmail`; `Contact` no administra información corporativa.
- Los atributos mínimos documentados pertenecen a sus tipos concretos y no se convierten en una convención obligatoria para todo Aggregate Root.

## Domain Exceptions

- Reservar `domain/exceptions/` para violaciones reales de reglas o invariantes de negocio, estados inválidos de Aggregates, Value Objects inválidos u operaciones de dominio no permitidas.
- Usar nombres específicos terminados en `Exception` cuando una excepción aporte significado; no crear una por cada error ni forzar una jerarquía ceremonial.
- `DomainException`, `ProjectCannotBePublishedException` e `InvalidProjectStateException` son ejemplos conceptuales, no tipos obligatorios ni implementados.
- No representar como Domain Exceptions entradas incompletas de un caso de uso, recursos ausentes, timeouts, SMTP, EF Core, PostgreSQL, filesystem, storage, HTTP o fallos de proveedor.

## Domain Services

- Crear un Domain Service solo para una regla de dominio que no pertenezca naturalmente a una Entity, Aggregate o Value Object.
- Nombrarlo con lenguaje del negocio y mantenerlo libre de detalles técnicos.
- No usar Domain Services como contenedores genéricos de métodos, coordinadores de casos de uso o wrappers de Infrastructure.
- La coordinación de puertos, transacciones y efectos externos pertenece normalmente a Application.

## Domain Events e Integration Events

- Usar tiempo pasado para hechos ocurridos: `ProjectPublishedDomainEvent`.
- Sufijos `DomainEvent` e `IntegrationEvent` para distinguir alcance.
- Mantener Domain Events dentro del monolito y crearlos solo para hechos relevantes del dominio, no para cada CRUD.
- Pueden despacharse mediante MediatR u otro mecanismo interno apropiado cuando exista una razón.
- Exponer Integration Events en `public/` solo si existe un consumidor real entre módulos o sistemas.
- No incluir Entities completas ni detalles internos en eventos.
- No introducir Kafka, RabbitMQ, Service Bus ni otro message broker en la V1 sin requisito.
- No confundir CQRS con Event Sourcing; Event Sourcing no forma parte de la arquitectura actual.

## Interfaces y ports

- Nombrar por capacidad: ejemplos conceptuales son `IClock`, `IEmailSender`, `IProjectReadStore` e `IMediaStorage`; evitar nombres genéricos como `IService`.
- Una interfaz pertenece a `Domain/Abstractions` únicamente si expresa una capacidad necesaria para una regla puramente de dominio y forma parte del lenguaje ubicuo.
- No colocar todas las interfaces del sistema en Domain.
- Declarar en `application/ports/` los ports requeridos por casos de uso para tiempo, correo, media storage, read stores, filesystem, gateways o integraciones.
- Implementarlos en Infrastructure y registrarlos en el composition root mediante Dependency Injection.
- Repository Pattern no es obligatorio.
- No introducir `IGenericRepository<T>`, `IProjectRepository` o un repositorio por agregado de forma automática.
- Preferir ports específicos alineados con capacidades o casos de uso, por ejemplo un read store, cuando exista una necesidad real.
- Para correo, expresar la capacidad requerida por el caso de uso; `IEmailSender` es un ejemplo conceptual, no un contrato fijado. Infrastructure implementa el adaptador del proveedor cuando se seleccione.
- Domain y Application no referencian SMTP ni SDKs de SendGrid, Mailgun, Resend, Amazon SES, Microsoft Graph, Gmail u otro proveedor.
- Infrastructure encapsula y traduce fallos técnicos al contrato esperado por Application; no filtra excepciones de proveedor a Domain.
- Nombrar implementaciones de Infrastructure por su tecnología o responsabilidad concreta cuando exista una decisión real, por ejemplo el patrón conceptual `SystemClock` o `{Provider}EmailSender`; no usar esos nombres para fijar anticipadamente un proveedor.

## Tiempo y `IClock`

- Cuando la hora actual afecte el comportamiento y deba ser controlable en tests, Application obtiene el instante mediante un port conceptual `IClock` en lugar de llamar directamente a `DateTime.Now` o `DateTime.UtcNow`.
- Application pasa el timestamp explícitamente a Domain; Domain no consulta el reloj del sistema.
- `IClock` pertenece por defecto a Application. Solo reevaluar una abstracción en Domain si una regla autónoma del dominio lo exige genuinamente.
- Una implementación conceptual como `SystemClock` pertenece a Infrastructure. No fijar todavía miembros, tipo temporal, namespace o lifetime de DI.
- En tests de Application, sustituir el port por un reloj determinista como `FakeClock` cuando exista.

## Validación de Application y Domain

- Application valida requests incompletos, parámetros requeridos, formatos propios del caso de uso, existencia de recursos, autorización/precondiciones y coherencia entre entradas.
- Co-localizar el validador con su Command o Query si es exclusivo del caso. No seleccionar ni asumir una librería de validación hasta que se apruebe e implemente.
- Domain valida invariantes que deben sostenerse independientemente del adaptador o caso de uso que invoque el modelo.
- Comprobar que se recibió un identificador y que el recurso requerido existe es normalmente Application; decidir si un Aggregate admite una transición es Domain.
- React, Directus o Presentation pueden mejorar la experiencia o proteger la frontera, pero no sustituyen Application ni Domain.

## Errores por capa

- **Domain:** invariantes, estados inválidos del modelo, creación inválida de Value Objects y operaciones de negocio no permitidas.
- **Application:** datos del caso de uso, recursos requeridos ausentes, precondiciones y validación contextual.
- **Infrastructure:** fallos de SMTP/proveedor, filesystem, storage, EF Core, PostgreSQL y APIs externas; capturarlos o traducirlos al contrato interior sin filtrarlos a Domain.
- **Presentation:** mapear resultados y errores aprobados a HTTP sin exponer stack traces, SQL, detalles SMTP, credenciales, configuración o excepciones internas.

Esta clasificación no selecciona todavía una estrategia global de excepciones o resultados explícitos.

## Dependency Injection y creación

- Resolver implementaciones técnicas en el composition root mediante Dependency Injection; Application y Domain no construyen adaptadores concretos.
- Prohibir en Application `new DbContext(...)`, clientes de Directus, adaptadores de correo, repositories concretos u otras dependencias técnicas.
- `new` no está prohibido de forma absoluta: Application puede crear Commands, DTOs y objetos de Domain válidos.
- Cuando la creación de Domain proteja invariantes complejas, preferir un constructor controlado, factory o método de creación explícito.

## Endpoints REST

Las rutas todavía no han sido definidas. Cuando se implementen:

- Usar sustantivos de recursos consistentes y preferentemente plurales.
- Usar segmentos en minúsculas; elegir y mantener una convención única para términos compuestos.
- Usar el método HTTP según semántica, no acciones arbitrarias en la ruta.
- Mantener request/response independientes de Entities y mappings internos.
- Los endpoints públicos de la V1 son consumidos por el Cliente sin autenticación. Incluyen lecturas y, cuando se implemente, la acción de enviar el formulario; no permiten modificar contenido administrado.
- Los endpoints internos de mutación son consumidos por Filter Hooks, despachan Commands y devuelven error o payload aprobado; sus rutas no se documentan hasta implementarse.
- Aplicar códigos HTTP coherentes para éxito, validación, ausencia y conflictos.
- No exponer detalles de excepciones internas.
- Registrar cada endpoint real en `README.md` y `ENDPOINTS.md`.

La estrategia de versionado de API y Controllers frente a Minimal APIs están pendientes.

## Base de datos

- Usar PostgreSQL y configurar mappings mediante EF Core en Infrastructure.
- Mantener `Persistence Model != Domain Model`: nunca configurar Aggregate Roots, Entities o Value Objects de Domain como entidades EF Core ni agregarles atributos de persistencia.
- Nombrar las clases técnicas de persistencia en `PascalCase` con sufijo `Model`, por ejemplo `ProjectModel`; no usar el sufijo `Record`.
- Cada `DbContext`, configuración, mapper y migration pertenece al Infrastructure del Bounded Context propietario.
- Usar únicamente `PortfolioDbContext`/`portfolio`, `ServicesDbContext`/`services` y `CompanyProfileDbContext`/`company_profile`; no crear `ContactDbContext` ni persistencia de `ContactRequest` sin una decisión funcional futura.
- No crear FKs ni navigations EF entre Bounded Contexts. Las referencias cruzadas se representan con UUID opacos y se validan mediante Application/contratos públicos.
- Directus puede leer directamente tablas del dominio y realiza el `INSERT`, `UPDATE` o `DELETE` final de una mutación aprobada.
- Toda mutación administrativa se intercepta antes de persistir mediante un Filter Hook que procesa la intención en ASP.NET Core.
- EF Core puede leer estado durante el procesamiento, pero no realiza una segunda escritura de la misma operación.
- Prohibir la doble persistencia y el uso de `SaveChanges` como segundo mecanismo dentro del Command de una mutación de Directus.
- Directus no modifica la estructura del dominio; EF Core Configuration y Migrations son la autoridad.
- Definir explícitamente `PRIMARY KEY`, nulabilidad/`NOT NULL`, `UNIQUE`, `FOREIGN KEY`, `CHECK`, índices y comportamientos de `DELETE` relevantes.
- Evitar consultas directas a tablas pertenecientes a otros módulos.

### Nombres de tablas y columnas

La convención física aprobada es explícita y uniforme:

- schemas: `snake_case` (`portfolio`, `services`, `company_profile`);
- tablas: nombre singular en `snake_case` (`project`, `corporate_client`, `social_link`);
- columnas: `snake_case` (`publication_status`, `company_profile_id`);
- claves primarias: prefijo `pk_`;
- claves foráneas: prefijo `fk_`;
- restricciones únicas: prefijo `uq_`;
- checks: prefijo `ck_`;
- índices no únicos: prefijo `ix_`.

No agregar un paquete de naming conventions para derivar estos nombres: definirlos en cada `IEntityTypeConfiguration<T>`. Después de cada migration, Directus debe adaptarse o introspeccionar el esquema resultante sin rediseñarlo.

### Migrations

- Usar nombres descriptivos en PascalCase: `CreatePortfolioSchema`, `AddProjectPublicationStatus`.
- Evitar nombres vagos como `Changes`, `Fix` o marcas de tiempo manuales como descripción.
- Una migration debe corresponder a un cambio coherente y revisable.
- Revisar `Up` y `Down`; señalar explícitamente cambios destructivos o pérdida de datos.
- No editar una migration ya aplicada en entornos compartidos; crear una nueva según la política que se establezca.
- Guardar cada migration y `ModelSnapshot` bajo `Persistence/Migrations/` del Infrastructure propietario; nunca usar una carpeta global de migrations.
- Mantener un historial por contexto en `{schema}.__ef_migrations_history`.

Los comandos de generación, scripting y aplicación están documentados en `DEVELOPMENT.md`.

## TypeScript y React

- Organizar el frontend con `app/`, `pages/`, `features/`, `components/`, `hooks/`, `services/`, `types/`, `utils/` y `assets/` cuando existan responsabilidades reales.
- No copiar en React las capas `Domain/`, `Application/`, `Infrastructure/` y `Presentation/` del backend.
- Usar `PascalCase` para componentes, tipos e interfaces de dominio de UI.
- Usar `camelCase` para funciones, hooks, variables y propiedades.
- Prefijar hooks personalizados con `use`: `useProjects`.
- Nombrar archivos de componentes de acuerdo con el componente principal; la convención exacta de extensiones y capitalización será uniforme.
- Mantener componentes enfocados en presentación o interacción y extraer acceso HTTP a `services/` o a la abstracción aprobada.
- No ejecutar `fetch` disperso en múltiples componentes.
- Tipar requests, responses y estados; evitar `any` salvo una frontera justificada y contenida.
- Representar estados de carga, vacío y error.
- Usar HTML semántico, responsive design y principios de accesibilidad.
- No agregar framework de UI, estado, routing o HTTP sin aprobación.

### Pages

- Representan pantallas o rutas completas y se nombran de forma consistente, por ejemplo `ProjectsPage` si el patrón real lo adopta.
- Componen features y componentes; no contienen clientes HTTP, URLs ni serialización de transporte.

### Features

- Agrupan comportamiento cohesivo de una capacidad como projects, services o contact.
- Pueden contener componentes, hooks y tipos específicos de la feature.
- No crear una feature por cada componente pequeño ni duplicar componentes que son reutilizables globalmente.

### Components

- Contienen UI reutilizable o específica de una feature según su ownership.
- No conocen EF Core, PostgreSQL, Directus, Entities .NET o URLs hardcodeadas.
- No ejecutan `fetch` arbitrario; reciben datos y callbacks o usan la composición aprobada de la feature.

### Hooks

- Usar prefijo `use` y crearlos solo para estado, ciclo de vida, composición o comportamiento React reutilizable.
- Pueden consumir services/API clients; los services no dependen de hooks.
- No convertir toda función o archivo de lógica en hook.

### Services y API clients

- Centralizan comunicación con ASP.NET Core, serialización y manejo técnico común de errores/cancelación cuando corresponda.
- Nombres como `apiClient`, `projectsApi`, `servicesApi` o `contactApi` son ejemplos conceptuales, no archivos obligatorios.
- Nunca llaman Directus o PostgreSQL ni contienen credenciales.

### Types

- Representan contratos HTTP o modelos necesarios para UI, no Entities o Aggregate Roots de .NET.
- Mantener explícita la frontera `Response DTO → HTTP → TypeScript type` y evitar compartir automáticamente clases de Domain.

## Dependencias entre frontend y backend

- React conoce el contrato HTTP, no Entities, namespaces o estructura interna de .NET.
- La URL base y configuración variable se externalizan cuando se implemente el entorno.
- Centralizar serialización, manejo común de errores y cancelación según las necesidades reales.
- React nunca conoce credenciales ni endpoints administrativos de Directus.
- React tampoco conoce credenciales, destinatarios internos, encabezados ni configuración del proveedor de correo, y nunca envía el correo directamente.
- Cliente y Administrador son actores funcionales, no tipos compartidos automáticamente entre frontend y backend.

## Formulario de contacto y correo

- El flujo es React → ASP.NET Core → MediatR → Application Command Handler; el Handler invoca Domain y un port de correo de Application, implementado por un adaptador de Infrastructure.
- Directus, sus Filter Hooks y PostgreSQL no forman parte del envío del formulario.
- `SubmitContactRequestCommand` expresa conceptualmente la intención aprobada; no representa código ni endpoint existente.
- React puede validar para UX, pero Presentation/Application vuelven a validar campos, formatos, longitudes, tipo de solicitud, consistencia e identificador del servicio.
- Usar un identificador de servicio y validarlo contra una capacidad mínima de `Services/public/`; `Contact` no consume `Services/internal/`, su `DbContext` ni sus tablas.
- Obtener `ContactRequestRecipientEmail` mediante `CompanyProfile/public/`; `Contact` no consume `CompanyProfile/internal/`, su `DbContext` ni sus tablas.
- No duplicar manualmente el catálogo de servicios en el formulario si `Services` es su fuente.
- Modelos React, Request DTOs, Commands y conceptos de Domain son fronteras distintas; mapearlos explícitamente.
- Crear `ContactRequest` mediante su API de Domain; no convertir el Request DTO en Aggregate. No crear por defecto una tabla: la persistencia histórica requiere un requisito independiente.
- Separar `From` técnico en Infrastructure, `To` desde `CompanyProfile` y `Reply-To` desde el `EmailAddress` validado del solicitante.
- Nunca aceptar del Cliente `From`, `To`, plantillas, credenciales o configuración técnica arbitrarios.
- Traducir fallos del proveedor a resultados seguros sin exponer stack traces ni detalles internos. Los códigos HTTP concretos permanecen pendientes.
- Diseñar antes de producción protección proporcional contra abuso, sin imponer CAPTCHA hasta que se justifique.

## Directus, Filter Hooks y multimedia

- Directus usa acceso directo a PostgreSQL para consultas administrativas y persistencia final aprobada.
- Los Filter Hooks conocen contratos HTTP internos de ASP.NET Core, no Entities ni `DbContext`.
- El uso de Filter Hooks bloqueantes para create/update/delete está aprobado; su autenticación frente a ASP.NET Core permanece pendiente.
- Los roles, policies y permissions editoriales deben aplicar mínimo privilegio y no habilitar cambios irrestrictos del Data Model.
- Separar archivos físicos de metadata o referencias del dominio.
- No almacenar archivos como BLOB o base64 dentro de Entities de PostgreSQL.
- Procesar la asociación de `ProjectMedia` con `Project` mediante Filter Hook y Command de `Portfolio`; Directus persiste la referencia aprobada.
- Mantener misión, visión, descripción institucional, eslóganes y textos estáticos en código; no crear `SiteSettings` sin necesidad.

## Tests

- Nombrar tests por comportamiento observable de acuerdo con el framework que se seleccione.
- Mantener Arrange, Act y Assert claros sin comentarios ceremoniales innecesarios.
- Un test debe fallar por una razón comprensible.
- Evitar datos compartidos mutables, tiempo real y dependencias externas no controladas.
- Usar sustitutos deterministas de Application Ports, como `FakeClock` y `FakeEmailSender` cuando los contratos correspondientes existan.
- Mantener los tests de Domain libres de SMTP, base de datos, reloj del sistema, HTTP y Directus.
- Colocar tests junto al área o en proyectos espejo según la estructura que se apruebe.
- Para el formulario, cubrir campos faltantes, correo inválido, tipo de solicitud inválido, servicio inexistente, envío correcto, fallo del proveedor y controles antiabuso cuando existan.

## Documentación y commits

- Toda documentación permanece en español; se conservan términos técnicos en inglés cuando sean naturales.
- No afirmar que una capacidad está implementada sin verificarla.
- Mantener enlaces relativos válidos y diagramas Mermaid comprensibles en GitHub.
- Los mensajes y la estrategia de commits no están fijados todavía; no se impone Conventional Commits sin aprobación.

## Reglas de dependencias resumidas

1. Domain es la capa más interna y no depende de frameworks o capas externas.
2. Application depende de Domain, lo orquesta y no reimplementa sus invariantes.
3. Ports de recursos externos requeridos por casos de uso pertenecen normalmente a Application; abstractions genuinamente de dominio pueden pertenecer a Domain.
4. Infrastructure implementa ports y puede depender del núcleo; el núcleo no depende de ella.
5. Presentation traduce HTTP, depende de Application y delega mediante MediatR.
6. Un módulo/Bounded Context solo consume `public/` de otro y no comparte Entities o Aggregate Roots.
7. React usa Page/Component → Feature/Hook → Service/API client → ASP.NET Core; nunca Directus.
8. EF Core controla el esquema del dominio y PostgreSQL aplica constraints.
9. Directus lee y escribe datos aprobados, pero EF Core controla el esquema.
10. Toda mutación administrativa pasa por un Filter Hook y ASP.NET Core antes de que Directus persista.
11. ASP.NET Core y Directus nunca escriben dos veces la misma mutación.
12. El formulario público pasa por un Command y un port de correo; nunca por Directus ni directamente desde React.
13. `Contact` valida servicios mediante `Services/public/`, obtiene el destinatario mediante `CompanyProfile/public/` y no asume persistencia de solicitudes.
14. Domain Exceptions expresan únicamente violaciones de negocio; Application, Infrastructure y Presentation conservan sus propios errores y traducciones.
15. El tiempo controlable se obtiene mediante un Application Port y se pasa explícitamente a Domain; el reloj real pertenece a Infrastructure.
16. `Portfolio`, `Services`, `CompanyProfile` y `Contact` son los Bounded Contexts iniciales; los conceptos internos no se convierten en módulos independientes.
