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
- `CorporateClients`: módulo conceptual de información institucional sobre organizaciones clientes; no representa cuentas del actor Cliente.
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

No se fija todavía un namespace raíz. Cuando se decida, los namespaces deberán reflejar módulo, visibilidad y capa de forma consistente sin depender innecesariamente de cada carpeta incidental.

## Módulos y carpetas

Patrón conceptual:

```text
modules/{module}/
├── public/
│   ├── contracts/
│   ├── dtos/
│   └── events/
└── internal/
    ├── domain/
    ├── application/
    │   ├── commands/
    │   │   └── {UseCase}/
    │   │       ├── {UseCase}Command.cs
    │   │       └── {UseCase}CommandHandler.cs
    │   ├── queries/
    │   │   └── {UseCase}/
    │   │       ├── {UseCase}Query.cs
    │   │       └── {UseCase}QueryHandler.cs
    │   └── ports/
    ├── infrastructure/
    └── presentation/
```

- El nombre del módulo representa una capacidad de negocio y se expresa en PascalCase en C#.
- Los casos de uso se agrupan uno por carpeta: `queries/GetProjects/` o `commands/PublishProject/`, no en archivos masivos de mensajes o Handlers.
- Co-localizar con el caso de uso sus DTOs o validadores exclusivos cuando mejore la cohesión; no crear archivos ceremoniales ni una carpeta vacía por cada categoría posible.
- Crear solo carpetas que contengan responsabilidades reales.
- `public/` contiene contratos entre módulos, no elementos públicos por accidente.
- `internal/` nunca se referencia desde otro módulo.
- Los módulos son candidatos a alinearse con Bounded Contexts, no contextos confirmados automáticamente.
- Definir un Bounded Context por lenguaje y modelo coherentes; no por tabla, Entity o carpeta.
- No compartir Entities o Aggregate Roots entre módulos/Bounded Contexts.

La capitalización física de carpetas se fijará al crear la solución y deberá usarse uniformemente.

## Commands

- Nombrar con verbo imperativo e intención: `PublishProjectCommand`, `UpdateContactInformationCommand`.
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

- Nombrar por resultado o búsqueda: `GetProjectsQuery`, `GetProjectBySlugQuery`.
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

- Usar sustantivos singulares: `Project`, `CorporateClient`, `Service` cuando el lenguaje de dominio los confirme.
- Una Entity requiere identidad y ciclo de vida; no convertir automáticamente cada tabla o DTO en Entity.
- Un Aggregate define un límite de consistencia y su Root protege las invariantes internas; no crear un Aggregate Root por tabla.
- Mantener identidad, comportamiento e invariantes dentro de Domain.
- Evitar modelos anémicos si existen reglas reales, pero no inventar comportamiento.
- Proteger estados inválidos mediante constructores, factories o métodos de comportamiento según el patrón acordado.
- No decorar Domain con atributos de EF Core, ASP.NET Core o Directus.
- Modificar un Aggregate Root a través de su API de dominio.
- Evitar setters públicos o manipulación desde Handlers que permitan saltarse invariantes.

## Value Objects

- Nombrar por concepto: `ProjectSlug`, no por representación (`StringWrapper`).
- Ser inmutables y validar sus invariantes al crearse.
- Implementar igualdad por valor.
- No permitir instancias inválidas con la expectativa de validarlas después en Application.
- No crear Value Objects para cada tipo primitivo si no protegen una regla o mejoran el modelo.
- Ejemplos potenciales como `ProjectSlug`, `EmailAddress` o `PhoneNumber` no son tipos obligatorios hasta que existan reglas reales.

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
- Directus puede leer directamente tablas del dominio y realiza el `INSERT`, `UPDATE` o `DELETE` final de una mutación aprobada.
- Toda mutación administrativa se intercepta antes de persistir mediante un Filter Hook que procesa la intención en ASP.NET Core.
- EF Core puede leer estado durante el procesamiento, pero no realiza una segunda escritura de la misma operación.
- Prohibir la doble persistencia y el uso de `SaveChanges` como segundo mecanismo dentro del Command de una mutación de Directus.
- Directus no modifica la estructura del dominio; EF Core Configuration y Migrations son la autoridad.
- Definir explícitamente `PRIMARY KEY`, nulabilidad/`NOT NULL`, `UNIQUE`, `FOREIGN KEY`, `CHECK`, índices y comportamientos de `DELETE` relevantes.
- Evitar consultas directas a tablas pertenecientes a otros módulos.

### Nombres de tablas y columnas

La convención física —por ejemplo, `snake_case` o nombres convencionales de EF Core— todavía no ha sido aprobada. Antes de la primera migration debe decidirse y aplicarse uniformemente. Después de cada migration, Directus debe adaptarse o introspeccionar el esquema resultante sin rediseñarlo.

### Migrations

- Usar nombres descriptivos en PascalCase: `CreateProjectsSchema`, `AddProjectPublicationStatus`.
- Evitar nombres vagos como `Changes`, `Fix` o marcas de tiempo manuales como descripción.
- Una migration debe corresponder a un cambio coherente y revisable.
- Revisar `Up` y `Down`; señalar explícitamente cambios destructivos o pérdida de datos.
- No editar una migration ya aplicada en entornos compartidos; crear una nueva según la política que se establezca.

La ubicación y el comando de generación se documentarán cuando exista la configuración real.

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
- El nombre conceptual `SubmitContactRequestCommand` o `SendContactRequestCommand` expresa la intención; el nombre definitivo se decide al implementar y no representa código existente.
- React puede validar para UX, pero Presentation/Application vuelven a validar campos, formatos, longitudes, tipo de solicitud, consistencia e identificador del servicio.
- Usar un identificador de servicio y validarlo contra una capacidad mínima de `Services/public/`; `Contact` no consume `Services/internal/`, su `DbContext` ni sus tablas.
- No duplicar manualmente el catálogo de servicios en el formulario si `Services` es su fuente.
- Modelos React, Request DTOs, Commands y conceptos de Domain son fronteras distintas; mapearlos explícitamente.
- No crear por defecto una Entity o tabla `ContactRequest`. La persistencia histórica requiere un requisito independiente.
- Mantener destinatario y configuración en Application/Infrastructure; nunca aceptar del Cliente destinatarios, encabezados, plantillas o credenciales arbitrarios.
- Traducir fallos del proveedor a resultados seguros sin exponer stack traces ni detalles internos. Los códigos HTTP concretos permanecen pendientes.
- Diseñar antes de producción protección proporcional contra abuso, sin imponer CAPTCHA hasta que se justifique.

## Directus, Filter Hooks y multimedia

- Directus usa acceso directo a PostgreSQL para consultas administrativas y persistencia final aprobada.
- Los Filter Hooks conocen contratos HTTP internos de ASP.NET Core, no Entities ni `DbContext`.
- El uso de Filter Hooks bloqueantes para create/update/delete está aprobado; su autenticación frente a ASP.NET Core permanece pendiente.
- Los roles, policies y permissions editoriales deben aplicar mínimo privilegio y no habilitar cambios irrestrictos del Data Model.
- Separar archivos físicos de metadata o referencias del dominio.
- No almacenar archivos como BLOB o base64 dentro de Entities de PostgreSQL.
- Procesar la asociación de archivos con Projects mediante Filter Hook y Command; Directus persiste la referencia aprobada.
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
13. `Contact` valida servicios mediante `Services/public/` y no asume persistencia de solicitudes.
14. Domain Exceptions expresan únicamente violaciones de negocio; Application, Infrastructure y Presentation conservan sus propios errores y traducciones.
15. El tiempo controlable se obtiene mediante un Application Port y se pasa explícitamente a Domain; el reloj real pertenece a Infrastructure.
