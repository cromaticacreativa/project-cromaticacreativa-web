# Cromática Creativa - Sitio Web Corporativo

Sitio web corporativo oficial de Cromática Creativa, concebido como un monorepo con frontend React, API ASP.NET Core, PostgreSQL y Directus como backoffice de contenido.

![C#](https://img.shields.io/badge/C%23-512BD4?logo=dotnet&logoColor=white)
![.NET](https://img.shields.io/badge/.NET-512BD4?logo=dotnet&logoColor=white)
![ASP.NET Core](https://img.shields.io/badge/ASP.NET_Core-512BD4?logo=dotnet&logoColor=white)
![Entity Framework Core](https://img.shields.io/badge/Entity_Framework_Core-512BD4?logo=dotnet&logoColor=white)
![MediatR](https://img.shields.io/badge/MediatR-CQRS-6D28D9)
![CQRS](https://img.shields.io/badge/Pattern-CQRS-0F766E)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Directus](https://img.shields.io/badge/Directus-263238?logo=directus&logoColor=white)
![Hexagonal Architecture](https://img.shields.io/badge/Hexagonal_Architecture-334155)
![Modular Monolith](https://img.shields.io/badge/Architecture-Modular_Monolith-1D4ED8)

## Descripción

La aplicación permitirá consultar información pública de Cromática Creativa: información general, misión, visión, servicios, proyectos y su contenido multimedia, clientes, datos de contacto, ubicación, redes sociales y futuro contenido corporativo. La V1 incluirá además un formulario público para que el Cliente envíe por correo una solicitud de contacto a la empresa.

El producto estará compuesto por una aplicación web pública en React, una API oficial en ASP.NET Core, PostgreSQL para los datos del dominio y una instancia self-hosted de Directus conectada al esquema existente como backoffice administrativo.

El actor público definido por el ERS es el **Cliente**. En esta versión, Cliente no significa usuario registrado: no tiene cuenta, registro, login, perfil, roles ni permisos persistidos; consulta contenido público y puede enviar el formulario de contacto mediante React, siempre a través de ASP.NET Core. El **Administrador** es el personal autorizado de Cromática Creativa que gestiona contenido mediante Directus.

## Contexto

Cromática Creativa necesita una presencia web corporativa cuyo contenido dinámico pueda ser gestionado por el Administrador sin desarrollar un panel propio. Directus cubrirá ese backoffice y se conectará directamente a PostgreSQL; Entity Framework Core conservará la autoridad exclusiva sobre el esquema del dominio. Antes de cada mutación administrativa, un Filter Hook bloqueante solicitará a ASP.NET Core que la valide, procese y, cuando corresponda, normalice.

Los Clientes Corporativos mostrados en el portafolio pertenecen al Bounded Context `Portfolio`. No deben confundirse con el actor funcional **Cliente** que consulta el sitio sin autenticación.

## Tipo de proyecto

- Monorepo.
- Monolito modular con un único deployment de backend.
- Arquitectura hexagonal por módulo.
- API REST en ASP.NET Core.
- Aplicación web pública independiente en React.
- CMS Directus self-hosted conectado al esquema PostgreSQL administrado por EF Core.

## Objetivos

- Presentar información corporativa, misión, visión, servicios y demás contenido institucional.
- Publicar proyectos realizados y sus imágenes o videos asociados.
- Mostrar clientes corporativos, ubicación, medios de contacto y redes sociales.
- Permitir que el Cliente consulte contenido público sin autenticación.
- Permitir que el Cliente envíe sin autenticación una solicitud de contacto por correo a Cromática Creativa.
- Permitir que el Administrador gestione contenido mediante Directus sin desarrollar un panel propio.
- Mantener el esquema de PostgreSQL controlado y versionado mediante Entity Framework Core.

## Alcance actual

Incluido en la visión inicial:

- Consulta de contenido corporativo por el Cliente, sin autenticación.
- Portafolio de proyectos y Clientes Corporativos, servicios y categorías, perfil corporativo y solicitudes de contacto.
- Contenido multimedia asociado donde corresponda.
- Formulario público con motivo de contacto, servicio ofrecido seleccionado y datos suficientes para que la empresa responda al Cliente.
- Envío de la solicitud por correo mediante ASP.NET Core y un port implementado por Infrastructure, sin participación de Directus.
- API pública como única fuente de datos del frontend.
- Edición de contenido mediante Directus por el Administrador.

Fuera del alcance de la primera versión:

- Comercio electrónico y pagos en línea.
- Registro, cuentas, login, perfiles, roles o permisos persistidos para el Cliente.
- Interacción entre Clientes mediante cuentas.
- Autenticación, roles o permisos propios de ASP.NET Core.
- Panel administrativo propio o desarrollado en React.

## Contenido estático y dinámico

Permanece definido en código por su baja frecuencia de cambio:

- Misión y visión.
- Descripción institucional general.
- Eslóganes y textos corporativos estáticos.

Se administra dinámicamente mediante Directus. Las lecturas administrativas consultan PostgreSQL directamente; las mutaciones se procesan primero mediante Filter Hooks y casos de uso de ASP.NET Core:

- Proyectos, su multimedia y Clientes Corporativos de `Portfolio`.
- Servicios y categorías de `Services`.
- Información de contacto, redes sociales y ubicación de `CompanyProfile`.

Directus no hace editable todo el sitio. No se creará una entidad `SiteSettings` ni un módulo equivalente únicamente para trasladar a PostgreSQL el contenido institucional estático.

## Arquitectura

La solución adopta DDD pragmático y arquitectura hexagonal dentro de un monolito modular. `Domain` es la capa más interna; `Application` orquesta sus modelos y reglas; `Presentation` e `Infrastructure` son adaptadores externos cuyas dependencias de código apuntan hacia el núcleo.

```mermaid
flowchart LR
    client["Cliente"] --> react["React / TypeScript"]
    react --> publicApi["ASP.NET Core API"]
    publicApi --> publicQuery["Application Query"]
    publicQuery --> readPort["Application Read Port"]
    ef["Infrastructure / EF Core"] -. "implementa" .-> readPort
    ef --> database[("PostgreSQL")]
```

Consulta administrativa:

```mermaid
flowchart LR
    administrator["Administrador"] --> directus["Directus Data Studio"]
    directus --> database[("PostgreSQL")]
```

Mutación administrativa:

```mermaid
flowchart LR
    administrator["Administrador"] --> directus["Directus Data Studio"]
    directus --> hook["Filter Hook bloqueante"]
    hook --> api["ASP.NET Core API"]
    api --> application["Application Handler"]
    application --> domain["Domain"]
    application --> hook
    hook --> directus
    directus --> database[("PostgreSQL")]
```

Formulario público de contacto:

```mermaid
flowchart LR
    client["Cliente"] --> form["React / Formulario"]
    form --> api["ASP.NET Core / Presentation"]
    api --> mediator["MediatR"]
    mediator --> handler["Application Command Handler"]
    handler --> services["Services / public"]
    handler --> profile["CompanyProfile / public"]
    handler --> domain["ContactRequest / Domain"]
    handler --> emailPort["Application Email Port"]
    adapter["Infrastructure / Email Adapter"] -. "implementa" .-> emailPort
    adapter --> provider["Proveedor de correo"]
    profile --> recipient["ContactRequestRecipientEmail"]
    provider --> recipient
```

Los identificadores Mermaid son únicamente nombres técnicos de nodos. Las líneas punteadas de implementación no indican que Application conozca Infrastructure. React nunca consume Directus. Directus puede consultar PostgreSQL y ejecuta el `INSERT`, `UPDATE` o `DELETE` final, pero solo después de la aprobación del backend. EF Core controla mappings, schema y migrations; ASP.NET Core no realiza una segunda escritura de la misma mutación. El formulario es un flujo público separado: Directus y PostgreSQL no intervienen en su envío.

La explicación completa y las decisiones vigentes se encuentran en [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Monolito modular

Todos los módulos pertenecen a la misma aplicación, se despliegan juntos y utilizan PostgreSQL. Aun así, cada módulo protege su modelo, casos de uso y detalles técnicos. La separación modular busca alta cohesión interna y bajo acoplamiento, sin la complejidad operativa de microservicios.

Los Bounded Contexts iniciales están definidos:

| Bounded Context | Responsabilidad | Modelo principal |
| --- | --- | --- |
| `Portfolio` | Trabajo realizado y portafolio público. | `Project`, `ProjectMedia`, `CorporateClient` |
| `Services` | Oferta comercial actual y categorías de trabajo. | `Service`, `ServiceCategory` |
| `CompanyProfile` | Información administrable para contactar y localizar a la empresa. | `CompanyContactInformation`, `CompanyLocation`, `SocialLink` |
| `Contact` | Procesamiento de solicitudes enviadas por Clientes. | `ContactRequest` |

`Project` y `CorporateClient` pertenecen a `Portfolio`; `CompanyLocation` pertenece a `CompanyProfile`. `Projects`, `CorporateClients`, `Location`, `Categories` y `Media` no son módulos independientes. Tampoco se crearán `Identity`, `Users`, `Site` o `SiteSettings` sin un requisito futuro explícito.

Entre Bounded Contexts se usan contratos mínimos expuestos mediante `public/`; nunca se comparten directamente Entities o Aggregate Roots ni se importa `internal/` ajeno.

### Resumen del modelo

- `Portfolio`: `Project` y `CorporateClient` son Aggregate Roots. `ProjectMedia` es una Entity interna controlada por `Project`. El proyecto conserva referencias propias al servicio y categoría, un `ProjectPeriod` cuyo `TotalDays` se deriva de las fechas y un estado de publicación distinto de los estados comerciales.
- `Services`: `Service` y `ServiceCategory` son Aggregate Roots. Ambos usan estados `Active`/`Inactive`; cada categoría pertenece a un único servicio. Su `ReferenceImage` ilustra el tipo de trabajo y no es multimedia de un proyecto real.
- `CompanyProfile`: `CompanyContactInformation` es Aggregate Root, `CompanyLocation` es su Entity interna y `SocialLink` es un Value Object. También administra `ContactRequestRecipientEmail`.
- `Contact`: `ContactRequest` es Aggregate Root para representar una solicitud válida. Esto no obliga a persistirla históricamente en la V1; el envío de correo sigue siendo un efecto de Application.

`Portfolio.Application` valida Service/Category mediante `Services/public/` y crea `ProjectServiceReference` y `ProjectCategoryReference` propios; `Portfolio.Domain` nunca depende de `Services.Domain`. `Contact.Application` consulta `Services/public/` para validar el servicio y `CompanyProfile/public/` para obtener el destinatario.

## Estructura general del repositorio

La fundación física inicial del backend ya existe. La solución usa proyectos separados por capa dentro de cada Bounded Context:

```text
/
├── frontend/                       # Conceptual; aún no creado
├── backend/
│   ├── CromaticaCreativa.sln
│   ├── Directory.Build.props
│   └── modules/
│       ├── Portfolio/
│       ├── Services/
│       ├── CompanyProfile/
│       └── Contact/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CONVENTIONS.md
│   ├── DECISIONS.md
│   ├── DEVELOPMENT.md
│   ├── ENDPOINTS.md
│   └── ROADMAP.md
├── AGENTS.md
├── global.json
└── README.md
```

Cada carpeta de Bounded Context contiene proyectos `{Context}.Domain`, `{Context}.Application`, `{Context}.Infrastructure` y `{Context}.Presentation`, con el prefijo `CromaticaCreativa.Modules`. El namespace raíz aprobado es `CromaticaCreativa.Modules`. Solo los proyectos Domain contienen implementación funcional en esta fase.

## Estructura de los módulos

Cada módulo separa las capas mediante proyectos `.csproj`, lo que permite restringir las dependencias con referencias de proyecto:

```mermaid
flowchart LR
    presentation["Presentation.csproj"] --> application["Application.csproj"]
    application --> domain["Domain.csproj"]
    infrastructure["Infrastructure.csproj"] --> application
    infrastructure --> domain
```

```text
modules/
└── Portfolio/
    ├── CromaticaCreativa.Modules.Portfolio.Domain/
    │   ├── Aggregates/
    │   ├── Entities/
    │   ├── Enums/
    │   ├── Exceptions/
    │   └── ValueObjects/
    ├── CromaticaCreativa.Modules.Portfolio.Application/
    ├── CromaticaCreativa.Modules.Portfolio.Infrastructure/
    └── CromaticaCreativa.Modules.Portfolio.Presentation/
```

- `Domain`: Entities, Aggregate Roots, Value Objects, Domain Events, invariantes, servicios y excepciones exclusivamente de negocio.
- `Application`: casos de uso, Commands, Queries, Handlers, validación contextual y ports.
- `Infrastructure`: EF Core, persistencia, PostgreSQL, tiempo del sistema, correo, almacenamiento e implementaciones de ports.
- `Presentation`: adaptadores HTTP, mapping y códigos de respuesta.

Los proyectos Application, Infrastructure y Presentation existen estructuralmente, pero no contienen lógica funcional ni referencias anticipadas. Las referencias se agregarán solo cuando un caso real las necesite y deberán respetar `Application → Domain`, `Presentation → Application` e `Infrastructure → Application/Domain`.

Los contratos públicos entre Bounded Contexts todavía no se materializan: se crearán únicamente cuando una historia de usuario tenga un consumidor real. `public` seguirá significando API entre módulos dentro del monolito y no exposición HTTP. Las carpetas Domain solo existen cuando contienen tipos reales; no se crearon `Events`, `Services` o `Abstractions` vacías.

## Comunicación entre módulos

Un módulo o Bounded Context solo puede consumir elementos de `otro-modulo/public/`. Queda prohibido importar clases de `otro-modulo/internal/`, compartir sus Entities/Aggregate Roots o acceder arbitrariamente a sus tablas y detalles de implementación.

Los DTOs, contratos/facades e Integration Events públicos deben ser explícitos y mínimos. Las Entities de Domain nunca se exponen como contratos HTTP. Se evitarán ciclos. Si una dependencia circular aparece, deberán revisarse los límites y el flujo del caso de uso antes de agregar una abstracción técnica.

## Backend

El backend usa C# sobre .NET 10 (`net10.0`), fijado al SDK `10.0.302` mediante `global.json`. La solución es `backend/CromaticaCreativa.sln`, el namespace raíz es `CromaticaCreativa.Modules` y cada Bounded Context dispone de un proyecto por capa. El host ASP.NET Core y la decisión entre Controllers y Minimal APIs todavía no se han implementado.

Los adaptadores HTTP delegarán en MediatR y no contendrán lógica de negocio. Presentation atenderá la API pública para consultas y envío del formulario, además de la API interna invocada por Filter Hooks. Domain no dependerá de ASP.NET Core, EF Core, PostgreSQL, Directus, MediatR, HTTP ni proveedores de correo.

Dirección de dependencias de código:

```text
Presentation ─────► Application ─────► Domain
Infrastructure ───► Application
Infrastructure ───► Domain
```

Application sí utiliza Domain: un Handler puede cargar o reconstruir un Aggregate mediante un port, invocar su comportamiento y coordinar efectos externos. No debe reimplementar invariantes ni depender de Infrastructure. Domain contiene Entities, Aggregate Roots, Value Objects, Domain Services y Events solo cuando modelan conceptos o reglas reales; DDD no obliga a crear un Aggregate por tabla, un Value Object por `string` o un Event por cada CRUD.

Las dependencias técnicas se reciben mediante Dependency Injection. Application no instancia `DbContext`, clientes de Directus, adaptadores de correo o repositorios concretos. Sí puede crear objetos de Domain cuando su constructor, factory o método de creación protege las invariantes correspondientes.

Los errores conservan la responsabilidad de su capa. Domain solo expresa violaciones de invariantes o reglas de negocio; Application maneja entradas, recursos ausentes y precondiciones del caso de uso; Infrastructure encapsula fallos de EF Core, PostgreSQL, SMTP, filesystem, storage o APIs externas; Presentation traduce resultados seguros a HTTP sin exponer excepciones internas. Esta clasificación no impone todavía una librería ni decide entre excepciones y resultados explícitos.

Los ports que Application necesita se declaran en `application/ports/` y se orientan a capacidades, no a tecnologías. Nombres como `IClock`, `IEmailSender`, `IProjectReadStore` o `IMediaStorage` son ejemplos conceptuales. Infrastructure implementa esos contratos y el composition root conecta ambas partes. En particular, cuando la hora actual afecta el comportamiento y debe ser testeable, Application la obtiene mediante un clock inyectado y pasa el valor a Domain; no consulta directamente `DateTime.Now` o `DateTime.UtcNow`, y Domain no accede al reloj del sistema. La firma definitiva de `IClock` y una posible implementación `SystemClock` se decidirán al implementarlas.

El detalle normativo se mantiene en [Arquitectura](docs/ARCHITECTURE.md) y [Convenciones](docs/CONVENTIONS.md).

## CQRS y MediatR

CQRS significa separar las responsabilidades de lectura y escritura cuando ambas existan. No obliga a cada módulo a tener Commands y Queries. MediatR será el mecanismo de despacho desde Presentation hacia Application.

Cada Command o Query se organiza en una carpeta por caso de uso y contiene su mensaje y Handler; los DTOs o validadores específicos pueden permanecer junto al caso cuando mejora la cohesión. Un Command contiene únicamente sus datos de entrada: no transporta `DbContext`, implementaciones concretas, Entities de Infrastructure ni detalles de Directus, SMTP o proveedores. Una Query es de solo lectura: no envía correo, no escribe, no muta Aggregates ni produce otros efectos observables.

```text
HTTP Request
    ↓
Presentation
    ↓
MediatR
    ↓
Command / Query → Handler
    ├──→ Domain
    └──→ Application Port
             ▲
             └── Infrastructure implementa
```

La consulta pública usará principalmente Queries y read ports con proyecciones directas; no cargará Aggregates solo por simetría. El envío del formulario es una acción y se representa conceptualmente mediante `SubmitContactRequestCommand`, que valida la solicitud, usa Domain e invoca un port de correo; una Query nunca envía correos. Las mutaciones administrativas procedentes de Filter Hooks también requerirán Commands para recuperar estado actual mediante ports, invocar comportamiento de Domain, rechazar la intención o devolver un payload canónico. El Command administrativo no debe ejecutar la persistencia final de esa misma mutación mediante `SaveChanges`; Directus la realiza después de recibir la aprobación. Estos nombres son conceptuales y no declaran código ni endpoints implementados.

Los Request DTOs se mapean a Commands o Queries y las respuestas se proyectan a Response DTOs. Las Entities de Domain no cruzan directamente la frontera HTTP.

## Frontend

React y TypeScript formarán una aplicación independiente dentro del monorepo, basada en HTML5, CSS3 y diseño responsive. Su arquitectura será modular y propia de React; no copiará artificialmente las capas `Domain/Application/Infrastructure/Presentation` del backend. No hay frameworks adicionales aprobados.

Estructura conceptual inicial:

```text
frontend/
└── src/
    ├── app/
    │   ├── routing/
    │   ├── providers/
    │   └── configuration/
    ├── pages/
    │   ├── Home/
    │   ├── Projects/
    │   ├── ProjectDetail/
    │   ├── Services/
    │   └── Contact/
    ├── features/
    │   ├── projects/
    │   ├── services/
    │   └── contact/
    ├── components/
    ├── hooks/
    ├── services/
    ├── types/
    ├── utils/
    └── assets/
```

`app/` compone routing, providers y configuración global; `pages/` representa pantallas completas; `features/` agrupa comportamiento por capacidad; `components/` contiene UI reutilizable; `hooks/` encapsula estado o comportamiento React realmente reutilizable; y `services/` centraliza el acceso a ASP.NET Core. `types/`, `utils/` y `assets/` contienen tipos de UI/contratos, utilidades y recursos, respectivamente. Esta estructura no se materializa con carpetas vacías.

```text
Page / Component
       ↓
Feature / Hook
       ↓
Service / API Client
       ↓
ASP.NET Core
```

Las Pages y los componentes visuales no ejecutan requests dispersos ni conocen EF Core, PostgreSQL, Directus o Entities de .NET. Los hooks pueden consumir services, pero los services no dependen de hooks. Los tipos TypeScript representan contratos HTTP o necesidades de UI: la frontera es `Domain/proyección → DTO HTTP → TypeScript type`, no clases de Domain compartidas.

En el formulario, `ContactPage` compone la feature de contacto; un hook conceptual como `useContactForm` solo se justifica si encapsula estado o comportamiento React; y el service/API client envía la solicitud a ASP.NET Core. React puede validar para UX, pero el backend vuelve a validar todo. React nunca envía correo directamente ni conoce credenciales, destinatarios internos o configuración del proveedor.

Funcionalmente, la página de servicios podrá presentar cada `Service` activo con sus categorías activas, incluyendo nombre, descripción y `ReferenceImage`. La página de portafolio podrá filtrar Projects publicados por Service y ServiceCategory. El detalle de un Project podrá mostrar título, descripción, Cliente Corporativo, servicio, categoría y `ProjectMedia`. `ProjectPeriod` existe en Domain, pero sigue pendiente decidir si la API/UI expondrá fechas, duración o ninguna de ellas.

## Base de datos

PostgreSQL será la base principal. **Entity Framework Core es el propietario del esquema** y es responsable de los Persistence Models, `DbContext`, configuraciones, migrations y evolución estructural. El modelo relacional está separado del modelo de Domain; ningún Aggregate Root o Value Object se configura directamente como entidad EF Core.

```mermaid
flowchart TD
    domain["Domain Model"] <--> mapper["Persistence Mapper"]
    mapper <--> model["Persistence Models"]
    model --> configuration["EF Core Configuration"]
    configuration --> migration["EF Core Migration"]
    migration --> database[("PostgreSQL")]
    database --> introspection["Directus introspecciona el esquema existente"]
```

La persistencia implementada usa `PortfolioDbContext`, `ServicesDbContext` y `CompanyProfileDbContext`, propietarios respectivos de los schemas `portfolio`, `services` y `company_profile`, de sus migrations y de su tabla `__ef_migrations_history`. `Contact` no tiene `DbContext` ni tabla para `ContactRequest`. Las referencias `portfolio.project.service_id` y `category_id` son UUID lógicos sin FK entre Bounded Contexts; la coherencia cruzada se validará mediante Application y contratos públicos cuando existan los casos de uso. PostgreSQL aplica `PRIMARY KEY`, `NOT NULL`, `UNIQUE`, `FOREIGN KEY` internas, `CHECK`, índices y comportamientos explícitos de eliminación. Directus se adaptará a los tres schemas creados y versionados por EF Core, no al contrario.

## Directus CMS

Directus será self-hosted y funcionará exclusivamente como CMS/backoffice para uno o, como máximo, dos Administradores. Proporcionará autenticación administrativa, usuarios, roles, policies, permissions, Data Studio, formularios, CRUD y gestión de archivos cuando corresponda.

```mermaid
flowchart TD
    administrator["Administrador"] --> directus["Directus CMS"]
    directus --> read["Consulta administrativa"]
    read --> database[("PostgreSQL")]
    directus --> mutation["Create / Update / Delete"]
    mutation --> hook["Filter Hook bloqueante"]
    hook --> api["ASP.NET Core / MediatR"]
    api --> result["Aprobación, error o payload canónico"]
    result --> hook
    hook --> directus
    directus --> database
```

- Directus no reemplaza la ASP.NET Core API.
- React no consume Directus directamente.
- ASP.NET Core es la API oficial del sitio.
- Directus lee directamente las tablas del dominio para listados, formularios y vistas administrativas.
- Tras la aprobación del Filter Hook, Directus ejecuta la persistencia final de `INSERT`, `UPDATE` o `DELETE`.
- El Filter Hook cancela la mutación si ASP.NET Core la rechaza y puede reemplazar o normalizar el payload aprobado.
- EF Core sigue siendo la única autoridad estructural; el Data Model del dominio no se modifica desde Directus.
- El usuario editorial habitual debe operar con roles, policies y permissions de mínimo privilegio, sin acceso irrestricto para alterar el modelo físico.
- Los datos internos del CMS —usuarios, sesiones, permisos y metadata— son responsabilidad de Directus.
- Aún debe decidirse si la persistencia interna del CMS usará una base separada, un schema separado o la misma instancia PostgreSQL.
- El Cliente no tiene cuenta de Directus ni cuenta propia en la aplicación.
- El Administrador accede al CMS Directus mediante credenciales administrativas para gestionar el contenido publicado en el sitio web.

La autenticación del Filter Hook frente a ASP.NET Core permanece pendiente. No se ha seleccionado API Key, JWT, OAuth, mTLS, shared secret ni otro mecanismo.

## Flujo de datos

Para lectura pública, el Cliente navega en React sin autenticación; React solicita datos a ASP.NET Core; Presentation despacha una Query; el Handler obtiene solo los datos necesarios mediante un port; Infrastructure consulta PostgreSQL con EF Core; y la API devuelve un contrato público.

Para consulta administrativa, Directus Data Studio lee PostgreSQL directamente; estas lecturas no atraviesan ASP.NET Core.

Para una mutación administrativa, Directus activa un Filter Hook bloqueante antes de persistir. El Hook llama a ASP.NET Core; Presentation despacha un Command mediante MediatR; Application recupera el estado mediante un port implementado con EF Core y orquesta las reglas e invariantes de Domain. Ante un error, Directus cancela la operación. Ante aprobación, el Hook devuelve el payload canónico y Directus ejecuta la única escritura final en PostgreSQL. ASP.NET Core no llama a `SaveChanges` para persistir por segunda vez esa misma mutación.

Para el formulario de contacto, React obtiene los servicios públicos mediante la Query correspondiente y usa sus identificadores en el selector. Al enviar, ASP.NET Core mapea el Request DTO a `SubmitContactRequestCommand`; `Contact.Application` valida la entrada, verifica el servicio mediante `Services/public/`, obtiene `ContactRequestRecipientEmail` mediante `CompanyProfile/public/`, crea `ContactRequest` y usa el port de correo. No accede a los `internal/` ajenos. Directus no participa y ser Aggregate Root no obliga a persistir históricamente la solicitud.

La solicitud contempla conceptualmente `PersonName`, empresa opcional, `EmailAddress`, `PhoneNumber`, `RequestType`, `RequestedServiceReference` y mensaje opcional. El `From` es una dirección técnica controlada por Cromática Creativa o el proveedor y configurada en Infrastructure; el `To` es `ContactRequestRecipientEmail` administrado en `CompanyProfile`; el `Reply-To` corresponde al correo del Cliente. Proveedor, asunto y plantillas permanecen pendientes.

Para multimedia, el archivo físico y la referencia del dominio son conceptos distintos. Los archivos no se almacenarán como BLOB o base64 en las Entities de PostgreSQL; `Portfolio` guardará las referencias necesarias. `ProjectMedia` representa imágenes o videos reales de un `Project`, mientras `ServiceCategory.ReferenceImage` es una imagen ilustrativa del tipo de trabajo. En la V1, Directus podrá subir físicamente un archivo a almacenamiento persistente. El Filter Hook enviará la asociación a ASP.NET Core para validarla mediante un Command y Directus persistirá la referencia aprobada. La implementación concreta y el uso eventual de URLs externas para videos grandes siguen abiertos.

## Tecnologías

| Área | Tecnologías o enfoque | Estado |
| --- | --- | --- |
| Frontend | React, TypeScript, HTML5, CSS3, Fetch API o cliente aprobado | Aprobado; sin versión |
| Backend | C#, .NET 10 (`net10.0`), SDK 10.0.302; ASP.NET Core Web API futuro | Fundación Domain implementada |
| Aplicación | CQRS, MediatR, Dependency Injection nativa | Aprobado |
| Persistencia | Entity Framework Core 10.0.10, Npgsql EF provider 10.0.3, dotnet-ef 10.0.10 | Modelo y migrations iniciales implementados |
| Datos | PostgreSQL | Aprobado; sin versión |
| CMS | Directus self-hosted, Data Studio, Filter Hooks | Aprobado; sin versión |
| Correo | Port de Application y adaptador de Infrastructure | Enfoque aprobado; proveedor pendiente |
| Arquitectura | Monorepo, monolito modular, DDD pragmático, cuatro Bounded Contexts definidos, arquitectura hexagonal | Aprobado |
| Contenedores | Docker | No establecido |

## Endpoints

Los endpoints serán añadidos a esta sección a medida que sean implementados. No existen endpoints en el repositorio actualmente.

| Método | Endpoint | Módulo | Descripción | Estado |
| ------ | -------- | ------ | ----------- | ------ |
| — | — | — | Aún no hay endpoints implementados. | Pendiente |

El catálogo detallado se mantendrá en [docs/ENDPOINTS.md](docs/ENDPOINTS.md) y esta tabla se actualizará junto con cada cambio de API.

## Seguridad

### Cliente

- No utiliza autenticación ni posee cuenta, roles o permisos persistidos.
- Consume endpoints públicos de lectura y puede enviar el formulario público de contacto mediante ASP.NET Core.
- No puede crear, modificar ni eliminar contenido administrado.
- Nunca determina destinatarios, encabezados, plantillas, credenciales o configuración interna del correo.

### Administrador

- Utiliza exclusivamente la autenticación administrativa de Directus.
- Directus debe estar protegido mediante HTTPS y limitado a uno o dos Administradores autorizados.
- Las credenciales administrativas no deben compartirse.
- PostgreSQL no debe exponerse directamente a Internet.
- El Administrador humano no se conecta directamente a las tablas del dominio.
- La comunicación Directus → ASP.NET Core deberá autenticarse y autorizarse antes de producción; el mecanismo técnico permanece pendiente.
- Los roles, policies y permissions de Directus deben aplicar mínimo privilegio y restringir la modificación del Data Model.

### ASP.NET Core API

- En la V1 no implementa login de Cliente, registro, ASP.NET Core Identity, roles propios ni panel administrativo.
- Expone lecturas públicas, procesa el Command público de contacto y recibe operaciones administrativas provenientes de Directus.
- Valida requests, DTOs, parámetros y precondiciones; Domain protege invariantes y PostgreSQL aplica constraints.
- Puede consultar estado actual mediante EF Core durante una mutación administrativa, pero no ejecuta la escritura final de esa misma operación.
- Protege configuraciones y secretos únicamente mediante variables de entorno.
- No versiona archivos `.env` con secretos ni credenciales en código.
- Aplica mínimo privilegio a las credenciales de base de datos.
- No expone información interna de Directus o PostgreSQL.
- No revela stack traces, credenciales ni detalles del proveedor de correo. El destinatario se obtiene desde `CompanyProfile`; la identidad técnica emisora y los secretos del proveedor se configuran en Infrastructure y permanecen fuera del repositorio.
- Antes de producción debe evaluarse protección del formulario frente a abuso: rate limiting, spam, automatización, límites de tamaño, tratamiento seguro del contenido y observabilidad. CAPTCHA no queda impuesto como solución.
- Utiliza HTTPS en producción y mantiene sus dependencias actualizadas mediante cambios revisados.

## Rendimiento

- Usar consultas EF Core optimizadas y `AsNoTracking()` para lecturas cuando corresponda.
- Evitar consultas N+1 y seleccionar solo los datos requeridos.
- Paginar colecciones cuando el volumen o el contrato lo requieran.
- Incorporar caching únicamente donde las métricas demuestren valor.
- Optimizar imágenes y videos para entrega web.
- Implementar endpoints asíncronos y propagar `CancellationToken` cuando corresponda.
- Medir antes de introducir optimizaciones o complejidad adicionales.

## Desarrollo local

La solución de backend, la herramienta local y los paquetes pueden restaurarse y compilarse con el SDK fijado:

```powershell
dotnet tool restore
dotnet restore backend/CromaticaCreativa.sln
dotnet build backend/CromaticaCreativa.sln --configuration Release
```

Estos comandos fueron verificados sobre SDK `10.0.302`. Existen las tres migrations iniciales y sus scripts SQL fueron revisados, pero no se aplicaron sobre PostgreSQL porque no se proporcionaron credenciales de desarrollo. Todavía no existe host ASP.NET Core, frontend ni proceso arrancable.

Cuando se incorporen las siguientes capas funcionales, esta sección deberá incluir y verificar además:

- Prerrequisitos y versiones soportadas.
- Restauración de dependencias de frontend y backend.
- Preparación de PostgreSQL y Directus.
- Aplicación de migrations.
- Arranque de API y frontend.
- Ejecución de pruebas.

El flujo de trabajo previsto está descrito en [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Variables de entorno

La conexión de design-time ya tiene nombre; las demás variables se documentarán al implementar sus consumidores, siempre sin incluir valores secretos:

| Configuración | Consumidor | Estado |
| --- | --- | --- |
| `CROMATICA_DB_CONNECTION_STRING` | Factories EF Core de design-time; futuro host ASP.NET Core | Definida; valor secreto no versionado |
| URL base de la API | React | Nombre pendiente |
| Configuración interna del CMS | Directus | Nombres pendientes |
| Conexión al PostgreSQL del dominio | Directus | Nombre pendiente |
| URL de la API interna para Filter Hooks | Directus | Nombre pendiente |
| Autenticación Directus → ASP.NET Core | Directus y ASP.NET Core | Mecanismo pendiente |
| Persistencia interna del CMS | Directus | Topología pendiente |
| Origen permitido del frontend | ASP.NET Core | Nombre pendiente si la configuración lo requiere |
| Almacenamiento multimedia | Componente por decidir | Pendiente de decisión |
| Dirección emisora técnica del formulario | Infrastructure | Nombre y valor pendientes; debe pertenecer a Cromática Creativa o cumplir las reglas del proveedor |
| Credenciales y configuración del proveedor de correo | Infrastructure | Proveedor y nombres pendientes |

Se deberá proporcionar un archivo de ejemplo seguro, como `.env.example`, únicamente cuando los nombres reales sean incorporados al proyecto. Los `.env` locales con secretos nunca deben versionarse.

## Testing

La estrategia y los frameworks de testing aún no han sido seleccionados. La implementación deberá cubrir proporcionalmente:

- Unit tests para reglas e invariantes de Domain.
- Tests de Application para Handlers y casos de uso.
- Tests deterministas de Application con sustitutos como `FakeClock` y `FakeEmailSender` cuando existan esos ports.
- Integration tests para persistencia EF Core y PostgreSQL.
- Integration tests del Filter Hook bloqueante, rechazo, normalización del payload y ausencia de doble escritura.
- Tests de Application del formulario: campos faltantes, formatos, tipo de solicitud, servicio inexistente o no disponible, éxito y fallo temporal del proveedor.
- Tests de API y frontend del formulario, incluida la protección frente a abuso cuando se implemente.
- Tests de API para contratos, mapping y códigos HTTP.
- Tests de frontend para comportamiento crítico.
- Pruebas de límites arquitectónicos si aportan valor sostenible: Domain sin dependencias externas, Application sin Infrastructure y módulos sin acceso a `internal/` ajeno.
- Pruebas de la frontera frontend para evitar acceso directo a Directus y requests HTTP dispersos cuando exista tooling apropiado.

Los tests de Domain no dependen de SMTP, base de datos, reloj del sistema, HTTP ni Directus. No se declaran comandos ni porcentajes de cobertura hasta que exista una configuración real.

## Convenciones

- Mantener el lenguaje del dominio consistente y nombres técnicos en inglés.
- Usar PascalCase para tipos C# y camelCase para variables/parámetros; seguir las convenciones de TypeScript y React en el frontend.
- Nombrar explícitamente `Command`, `Query`, `Handler` y `Dto` según su responsabilidad.
- Organizar casos de uso por feature, no en carpetas globales desconectadas.
- Respetar la dirección de dependencias de la arquitectura hexagonal.
- Evitar abstracciones, dependencias y refactors masivos sin una necesidad concreta.
- Actualizar documentación, tabla de endpoints y migrations junto con el cambio correspondiente.

Las reglas detalladas se encuentran en [docs/CONVENTIONS.md](docs/CONVENTIONS.md) y las instrucciones obligatorias para agentes en [AGENTS.md](AGENTS.md).

## Documentación adicional

- [Arquitectura](docs/ARCHITECTURE.md): fuente de verdad arquitectónica.
- [Desarrollo](docs/DEVELOPMENT.md): flujo para agregar funcionalidades y módulos.
- [Convenciones](docs/CONVENTIONS.md): nombres, organización y dependencias.
- [Roadmap](docs/ROADMAP.md): fases sin fechas comprometidas.
- [Endpoints](docs/ENDPOINTS.md): catálogo de la API.
- [Decisiones](docs/DECISIONS.md): registro ligero de ADRs.
- [Guía para agentes](AGENTS.md): reglas obligatorias para futuros cambios.

## Estado del proyecto

El proyecto se encuentra en la **Fase 2 — Modelo de dominio y persistencia**. Existen la solución .NET 10, 16 proyectos separados por capa, los modelos Domain de `Portfolio`, `Services`, `CompanyProfile` y `Contact`, y la persistencia EF Core/PostgreSQL de `Portfolio`, `Services` y `CompanyProfile` con diez Persistence Models, tres `DbContext`, configuraciones, mappers y migrations iniciales. Application y Presentation permanecen sin lógica funcional; `Contact` continúa solo en Domain y sin persistencia. No existen host ASP.NET Core, frontend, endpoints ni configuración de deployment.

Siguen pendientes Controllers o Minimal APIs, ejecución de migrations sobre un PostgreSQL configurado, límites transaccionales de futuros casos de uso, multimedia, integración y persistencia interna de Directus, autenticación Directus → ASP.NET Core, proveedor y configuración técnica de correo, política antiabuso, posible persistencia histórica de solicitudes, framework de testing y deployment. Consulte [docs/ROADMAP.md](docs/ROADMAP.md) para el seguimiento.
