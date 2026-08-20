# Convenciones

Estas convenciones describen la fundación backend TypeScript/NestJS activa. React/Vite continúa como objetivo futuro.

## Principios y terminología

- Usar lenguaje de negocio y nombres explícitos; evitar abstracciones genéricas prematuras.
- Organizar por Bounded Context y feature, no por tipo técnico global.
- **Cliente** es el actor público sin autenticación; `Client` es una Entity efímera de Contact; **Administrador** usaría el CMS provisional; `CorporateClient` pertenece a Portfolio.
- Los contextos son `Portfolio`, `Services`, `CompanyProfile` y `Contact`.
- No compartir tipos internos, Entities, Aggregates o modelos de persistencia entre contextos.

## TypeScript

- `PascalCase` para archivos y tipos principales del backend: clases, interfaces, enums, Value Objects, Aggregates, Entities, Mappers, Ports, Adapters y Modules.
- Ejemplos: `Project.ts`, `ProjectId.ts`, `ProjectMapper.ts`, `CompanyContactInformation.ts`, `CompanyProfileModule.ts`.
- `camelCase` para funciones, métodos, variables, parámetros y propiedades.
- Mantener un concepto principal por archivo. No agrupar conceptos en archivos como `portfolio.value-objects.ts`, `services.enums.ts` o `company-profile.persistence-values.ts`.
- `main.ts` es la excepción técnica en minúsculas por ser el entrypoint.
- Evitar `any`; contener y validar las fronteras externas.
- No fijar formatter, linter o aliases hasta que exista configuración real. Los tests actuales usan `node:test` sobre TypeScript compilado.
- Toda interfaz de Domain o Application usa prefijo `I`; los DTOs planos se declaran como tipos con sufijo `Dto`.

## Capas y módulos NestJS

Cada Bounded Context vive bajo `backend/src/modules/{Context}`. Solo se crea `public` cuando exista un consumidor intermodular real.

```text
{Context}/
├── {Context}.Domain/{Abstract,Aggregates,Entities,ValueObjects,Enums,Exceptions}
├── {Context}.Application/{Ports,Validations,Commands,Queries}
├── {Context}.Infrastructure/{Persistence,Adapters}
├── {Context}.Presentation/
│   ├── Controllers/
│   ├── Mappers/
│   └── DTOs/                 # solo con contrato de transporte real
├── {Context}.Commons/DTOs
└── {Context}Module.ts
```

- Domain no importa NestJS, TypeORM, MySQL, Directus o HTTP.
- Application depende de Domain.
- Presentation depende de Application.
- Infrastructure puede depender de Application y, para mapping justificado, de Domain.
- Prohibidas las dependencias inversas y los accesos a `internal/` ajeno.
- Los módulos NestJS usan `{Context}Module.ts`; no contienen lógica.
- No crear una capa `src/database`, `shared/domain`, Shared Kernel o carpetas técnicas globales propietarias del modelo.
- `{Context}.Commons` es local, no una quinta capa, y un Commons global está prohibido.

## Archivos NestJS y CQRS

- Controllers: `{Feature}Controller.ts`.
- Módulos NestJS: `{Context}Module.ts`.
- Commands: `{UseCase}Command.ts`; handlers: `{UseCase}CommandHandler.ts`.
- Queries: `{UseCase}Query.ts`; handlers: `{UseCase}QueryHandler.ts`.
- DTOs: `{Intent}RequestDto.ts` y `{Intent}ResponseDto.ts`, ajustados al contrato real.
- Mappers: `{Concept}Mapper.ts`.

Los nombres de clases usan sufijos `Command`, `CommandHandler`, `Query`, `QueryHandler` y `Dto` cuando corresponda. Los casos de uso se agrupan por feature y no en archivos masivos.

### Commands

- Nombrar por intención, por ejemplo `PublishProjectCommand`.
- Incluir únicamente datos de entrada; nunca Persistence Models TypeORM, DataSource, adapters o detalles de Directus.
- Pueden coordinar efectos mediante ports.
- En mutaciones administrativas, devuelven error, aprobación o payload canónico y no realizan la escritura final.
- No crear Commands CRUD por simetría.

### Queries

- Nombrar por resultado, por ejemplo `GetProjectsQuery`.
- Son de solo lectura: no escriben, mutan Aggregates ni envían correo.
- Proyectan DTOs, no exponen `QueryBuilder`, Persistence Models TypeORM o Domain Entities.
- No reconstruyen un Aggregate cuando solo se necesita una proyección.
- Evitan N+1 y seleccionan únicamente campos necesarios.

### Handlers

- Un Handler representa un caso de uso.
- Recibe ports por Dependency Injection y delega invariantes a Domain.
- No accede a implementaciones internas de otros contextos.
- No contiene reglas HTTP ni construye dependencias técnicas manualmente.

## Domain

- Aggregates, Entities y Value Objects usan sustantivos singulares del lenguaje ubicuo.
- Un Aggregate Root protege su límite; no se crea uno por tabla.
- Los Value Objects son inmutables, válidos desde su creación y comparados por valor.
- No agregar decoradores NestJS, TypeORM, validadores HTTP o serialización técnica.
- Domain Exceptions expresan exclusivamente reglas/invariantes; no fallos de MySQL, correo, storage o HTTP.
- Los mensajes propios de Domain y Application se escriben en español; los nombres de clases y términos técnicos permanecen en inglés.
- `Domain/Abstract` contiene únicamente interfaces reales con prefijo `I`; nunca clases abstractas, repositories, DataSource, correo, storage o HTTP.
- Las clases base locales de Value Objects se ubican en `Domain/ValueObjects/Base`.
- Un ID Domain se construye con un valor explícito, por ejemplo `new ProjectId(uuid)`. El ID Value Object valida y representa identidad; no es un generador.
- No crear factories como `ProjectId.new()` si generan UUID dentro de Domain. `UuidValueObject` normaliza y valida UUID no vacíos, sin `node:crypto`.
- Domain Services y Domain Events solo se crean con una regla o hecho relevante real.
- No introducir Event Sourcing ni message brokers sin decisión explícita.

Modelo preservado:

- Portfolio: `Project`, `CorporateClient`, `ProjectMedia`, `ProjectPeriod`, referencias propias a Service/Category.
- Services: `Service`, `ServiceCategory`, pertenencia exacta y `ReferenceImage` distinta de `ProjectMedia`.
- CompanyProfile: `CompanyContactInformation`, colecciones públicas de `PhoneNumber` y `EmailAddress`, `SocialLink` —incluido WhatsApp—, `CompanyLocation` Value Object y destinatario interno único.
- Contact: `Client` con identidad interna no persistida y `ContactRequest` compuesto con `TipoSolicitud`, `requestedService` y mensaje opcional; Domain no envía correo.

## Ports y Dependency Injection

- Nombrar interfaces por capacidad; no usar nombres genéricos como `IService` ni repositories genéricos.
- Los ports de recursos externos pertenecen normalmente a Application.
- Infrastructure implementa y el composition root NestJS registra las dependencias.
- No fijar por adelantado `IClock`, `IEmailSender`, `IUuidGenerator`, `IIdGenerator` u otros contratos hasta que un caso real defina su forma.
- Application puede crear objetos de Domain válidos, pero no instanciar DataSource, TypeORM repositories, SMTP o clientes externos concretos.
- Application/composition genera o proporciona el UUID antes de construir un Aggregate, Entity o ID Value Object que requiera identidad.
- Ubicar interfaces externas consumidas por casos de uso en `Application/Ports` y sus implementaciones en `Infrastructure/Adapters` o `Infrastructure/Persistence` según corresponda.
- Ubicar reglas de entrada, existencia y precondiciones del caso de uso en `Application/Validations`; las invariantes intrínsecas continúan en Domain.
- Si no hay consumidor real, mantener `Ports` y `Validations` únicamente mediante `.gitkeep`.

## Commons locales

- Cada `backend/src/modules/{Context}/{Context}.Commons/DTOs` contiene contratos planos internos compartidos por adaptadores/mappers del mismo módulo; no son contratos HTTP.
- Los Persistence Models pueden implementar esos tipos y los mappers aceptarlos como entrada; los DTOs no contienen decoradores o comportamiento.
- CompanyProfile conserva sus DTOs internos exclusivamente en `CompanyProfile.Commons/DTOs`; `CompanyProfile.Presentation` contiene solo `Controllers` y `Mappers`.
- No mover a Commons Entities, Value Objects, Persistence Models, helpers, utilidades genéricas, ports, configuración, TypeORM o validaciones.
- Un DTO exclusivo de transporte HTTP permanece en `{Context}.Presentation/DTOs` del módulo propietario.

## DTOs y HTTP

- Request/Response DTOs son contratos de transporte HTTP en `{Context}.Presentation/DTOs`, no Entities de Domain ni Persistence Models TypeORM. Ejemplos: `SubmitContactRequestDto` y el futuro `GetProjectsResponseDto`.
- Commons DTOs son contratos planos internos de adaptador/persistencia, como `ProjectPersistenceDto`, `CompanyProfilePersistenceDto` y `PhonePersistenceDto`; no representan HTTP.
- Domain no depende de DTOs de Presentation ni de Commons.
- Mapear `Request DTO → Command/Query` y `Domain/proyección → Response DTO`.
- Controllers no contienen negocio y delegan a `CommandBus`/`QueryBus`.
- No definir rutas, códigos, versionado o estrategia global de errores antes del primer endpoint real.
- Registrar cada endpoint implementado en `README.md` y `ENDPOINTS.md`.
- No exponer stack traces, SQL, credenciales, configuración o excepciones internas.

## Persistencia TypeORM/MySQL

- `Persistence Model != Domain Model`.
- Las clases TypeORM usan sufijo `PersistenceModel` y archivos como `ProjectPersistenceModel.ts`; no se denominan simplemente igual que el Aggregate.
- Los Persistence Models y sus decoradores viven exclusivamente en `Infrastructure/Persistence/Models` del módulo propietario.
- Usar mappers explícitos Domain ↔ Persistence.
- TypeORM Migrations controla el esquema; `synchronize: true` está prohibido en producción.
- Revisar PK, FK internas, `NOT NULL`, `UNIQUE`, checks, índices, cardinalidades y delete behaviors.
- Usar un único DataSource en `src/Infrastructure/Persistence/TypeOrmDataSource.ts` y una única base MySQL. Cada módulo conserva ownership de Models, Mappers, Configurations y Migrations mediante `TypeOrmModule.forFeature(...)`.
- UUID: `CHAR(36)` ASCII/binario. Tablas/columnas: singular `snake_case`; constraints: `pk_`, `fk_`, `uq_`, `ck_`, `ix_`.
- Configuración: `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` y `PORT`.
- No crear FKs ni joins técnicos entre Bounded Contexts sin decisión explícita.
- `ContactRequest` no recibe tabla por ser Aggregate Root.
- Directus provisional no altera la estructura del dominio; introspeccionaría tablas creadas externamente.

En CompanyProfile:

- `company_profile` guarda el destinatario interno único;
- `phone` y `email` guardan colecciones públicas con `display_order` y unicidad por valor dentro del profile;
- WhatsApp es un `social_link`, nunca un tipo de phone;
- `location.company_profile_id` es simultáneamente PK y FK; no existe ID Domain de ubicación.

Los nombres de migrations usan PascalCase y describen un cambio coherente. Cada migration vive en `Infrastructure/Persistence/Migrations` del módulo propietario; no se agregan migrations globales.

## React y Vite — futuro

- El frontend no está implementado en la fase actual.
- Cuando se implemente, organizar `app`, `pages`, `features`, `components`, `hooks`, `services`, `types`, `utils` y `assets` solo cuando exista responsabilidad real.
- No replicar las capas hexagonales del backend.
- Componentes en `PascalCase`; funciones, props y hooks en `camelCase`; hooks personalizados empiezan por `use`.
- Pages componen UI; services centralizan HTTP; no dispersar `fetch` en componentes.
- React consume únicamente NestJS REST, nunca Directus o MySQL.
- Tipar contratos HTTP y estados de carga, vacío, éxito y error.
- Mantener HTML semántico, accesibilidad y diseño responsive.
- No elegir librerías adicionales sin requisito y aprobación.

## Aplicaciones externas de infraestructura

- Las aplicaciones/herramientas técnicas externas al backend viven bajo `infrastructure/`, no bajo `backend/src/Infrastructure/`.
- El CMS administrativo independiente vive exactamente en `infrastructure/CMS/Directus/` y tiene su propio `package.json`, `package-lock.json`, `.env`, proceso Node, extensions y uploads.
- Directus no es un Bounded Context ni un módulo NestJS. No se le aplican las capas Domain/Application/Infrastructure/Presentation ni la nomenclatura `{Context}.{Layer}`.
- Las extensions futuras viven en `infrastructure/CMS/Directus/extensions/`; HU09 no materializa Filter Hooks, endpoints, interfaces, módulos o displays.
- Directus y el DataSource TypeORM se conectan a una misma base MySQL. Las variables `DB_HOST`, `DB_PORT` y `DB_DATABASE` deben corresponder a `MYSQL_HOST`, `MYSQL_PORT` y `MYSQL_DATABASE`.
- TypeORM Migrations controla la estructura de las tablas de negocio; el Data Model de Directus no se usa para crear o alterar sus columnas, constraints o relaciones.
- El bootstrap oficial de Directus controla únicamente sus tablas internas `directus_*` y el primer Administrador.
- Las cuentas y la autenticación administrativas pertenecen a Directus. No crear autenticación administrativa paralela en NestJS o React ni habilitar el registro público.
- `.env`, `SECRET`, contraseñas y credenciales reales de Directus no se versionan.

## Contacto, Directus y multimedia

- Flujo futuro de contacto: React → `SubmitContactRequestDto` → Presentation → `SubmitContactRequestCommand` → `CommandBus` → Contact.Application → `Client` + `ContactRequest` → `ContactEmailDto` → `IEmailSenderPort` → adapter SMTP.
- Actualmente solo existen el DTO de entrada plano y la fundación Domain; no existen Command, ports, `ContactEmailDto`, adapter ni endpoint.
- Los futuros ports se denominarán `IServicesReadPort`, `ICompanyProfileReadPort` e `IEmailSenderPort` y solo se materializarán con el caso de uso consumidor.
- Validar Service mediante `Services/public/` y obtener `To` mediante `CompanyProfile/public/`.
- Separar `From` técnico, `To` administrable y `Reply-To` del Cliente.
- Directus no participa ni se crea una tabla automáticamente.
- Directus `12.3.0` está incorporado para HU09, continúa provisional y toda afirmación sobre Hostinger requiere la PoC completa.
- Si se adopta, mutaciones administrativas: Filter Hook → NestJS Command → payload aprobado → escritura final única de Directus.
- No almacenar archivos como BLOB/base64 del modelo de Domain; storage sigue pendiente.

## Tests y documentación

- Nombrar tests por comportamiento observable cuando se seleccione tooling.
- Domain tests sin framework web, base, correo, reloj real o Directus.
- Application tests con sustitutos deterministas de ports.
- Infrastructure integra mappers, TypeORM y MySQL; hooks prueban bloqueo y ausencia de doble escritura.
- No inventar comandos ni porcentajes de cobertura.
- Documentación en español, términos técnicos naturales en inglés y estado verificable.

## Resumen obligatorio

1. El frontend aún no existe; React solo consumirá NestJS.
2. Presentation delega mediante `CommandBus`/`QueryBus`.
3. Application orquesta Domain y declara ports.
4. Domain permanece libre de frameworks.
5. TypeORM Persistence Models viven solo en Infrastructure del módulo propietario y no son Domain Entities.
6. TypeORM Migrations controla MySQL; no `synchronize: true` en producción.
7. Los contextos solo consumen `public/` ajeno.
8. Directus es provisional hasta la PoC.
9. Directus sería el escritor final único de mutaciones administrativas aprobadas.
10. El formulario no usa Directus ni presupone historial.
11. No reintroducir la fundación .NET/EF/PostgreSQL retirada sin una decisión explícita.
