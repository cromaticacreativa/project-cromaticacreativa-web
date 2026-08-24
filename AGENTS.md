# Guía para agentes

Estas reglas son obligatorias para todo el repositorio salvo que un `AGENTS.md` más específico establezca reglas adicionales.

## Trabajo y estado tecnológico

- Mantener el alcance solicitado, preservar trabajo existente y evitar refactors ajenos.
- No inventar requisitos, versiones, endpoints, comandos, variables de entorno o infraestructura.
- No agregar dependencias ni abstracciones sin necesidad real; documentar los cambios relacionados.
- No almacenar secretos ni `.env` sensibles en Git.
- La fundación activa usa Node.js 22, TypeScript, NestJS, `@nestjs/cqrs`, TypeORM y MySQL. React + TypeScript + Vite es objetivo futuro y todavía no está implementado.
- No reintroducir .NET, EF Core o PostgreSQL sin una nueva decisión explícita.
- **Directus fue retirado definitivamente (ADR-025); no reintroducirlo.** La plataforma administrativa vigente es **Strapi 5**, sobre una base MySQL **única compartida** con el backend, pero las **TypeORM migrations** siguen siendo la autoridad estructural de las tablas de negocio y Strapi gobierna solo sus tablas internas (ADR-027).
- **La ejecución de Strapi en el Hostinger Business Web Hosting existente es una PoC pendiente; ningún agente debe asumir que su deployment está validado.**

## Terminología y alcance

- **Cliente** es el actor público sin cuenta, registro, login, perfil, roles ni permisos persistidos.
- `Client` es una Entity interna y no persistida de `Contact.Domain`; no representa una cuenta, el actor como identidad persistente ni un `CorporateClient`.
- **Administrador** es el personal autorizado que se autentica con una cuenta previamente configurada en Strapi (CMS administrativo). La adopción productiva del CMS sigue condicionada a la PoC.
- `CorporateClient` es un Aggregate Root de `Portfolio`, no el actor Cliente.
- La V1 no incluye comercio electrónico, pagos, cuentas, autenticación propia, roles propios del backend ni panel administrativo React.
- Misión, visión, descripción institucional, eslóganes y textos poco cambiantes permanecen en código; no crear `SiteSettings` o `Site` sin requisito.

## Arquitectura obligatoria

- Mantener monorepo y backend como monolito modular; no introducir microservicios.
- Aplicar DDD pragmático y arquitectura hexagonal dentro de cada módulo.
- Preservar `Presentation → Application → Domain`; Infrastructure puede depender de Application y, solo si un mapping real lo requiere, de Domain.
- Prohibir `Domain → Application/Infrastructure/Presentation` y `Application → Infrastructure/Presentation`.
- Domain no depende de NestJS, `@nestjs/cqrs`, TypeORM, MySQL, el CMS (Strapi), HTTP ni proveedores externos.
- Application contiene casos de uso y ports; Presentation adapta HTTP; Infrastructure implementa detalles técnicos.
- Usar Dependency Injection de NestJS en el composition root; las capas interiores no instancian adaptadores concretos.
- Mantener los Bounded Contexts `Portfolio`, `Services`, `CompanyProfile` y `Contact`.
- Cada Bounded Context vive bajo `backend/src/modules/{Context}` y materializa `{Context}.Domain`, `{Context}.Application`, `{Context}.Infrastructure`, `{Context}.Presentation` y `{Context}.Commons`.
- Usar PascalCase para archivos que representen clases, interfaces, enums, Value Objects, Aggregates, Entities, Mappers, Ports, Adapters y Modules; mantener un concepto principal por archivo.
- Prohibido crear `shared/domain`, Shared Kernel, `src/database`, repositories genéricos o una migration global propietaria del modelo.
- `{Context}.Commons/DTOs` es local al contexto y contiene contratos de datos planos internos compartidos por sus adaptadores/mappers; no representa HTTP, no es una quinta capa y no contiene Domain, helpers, configuración, ports o decoradores TypeORM. Prohibido recrear un Commons global.
- Ningún contexto importa `internal/` ajeno, comparte Aggregates/Entities o consulta arbitrariamente tablas ajenas.
- La comunicación entre contextos usa contratos mínimos de `public/` solo con consumidor real.
- No crear `Contracts`, Shared Kernel, módulos por tabla ni enums universales por simetría.

## Modelo por Bounded Context

### Portfolio

- `Project` y `CorporateClient` son Aggregate Roots; `ProjectMedia` es Entity interna de `Project`.
- `Project` referencia como máximo un CorporateClient principal.
- `ProjectPeriod` protege `EndDate >= StartDate`; `TotalDays` es derivado.
- `PublicationStatus` (`Draft`/`Published`) no equivale a `Active`/`Inactive`.
- `ProjectServiceReference` y `ProjectCategoryReference` pertenecen a Portfolio.Domain.
- Portfolio.Application valida Service, Category y pertenencia mediante `Services/public/`.

### Services

- `Service` y `ServiceCategory` son Aggregate Roots; cada categoría pertenece a exactamente un Service.
- Sus estados son `Active`/`Inactive`; solo se exponen categorías Active cuyo Service también esté Active.
- `ReferenceImage` es ilustrativa y no equivale a `ProjectMedia`.
- El efecto de desactivar una categoría sobre Projects históricos sigue pendiente.

### CompanyProfile

- `CompanyContactInformation` es Aggregate Root y administra listas de teléfonos públicos, correos públicos y SocialLinks, además de una ubicación opcional y un único `ContactRequestRecipientEmail`.
- `CompanyLocation` es un Value Object compuesto por `Address` y `GeoCoordinates`; no posee ID Domain.
- WhatsApp no es un `PhoneNumber` especial: se representa como `SocialLink` y se persiste en `social_link`.
- Los correos públicos no incluyen automáticamente `ContactRequestRecipientEmail`.
- Domain no crea Entities o IDs para las filas técnicas de phone, email o social_link.
- El destinatario no es el correo público ni el `From` técnico y no se expone sin requisito.

### Contact

- `Contact` procesa exclusivamente el formulario.
- `ContactRequest` es Aggregate Root, pero no implica tabla ni persistencia histórica.
- `Client` es una Entity interna con `ClientId` efímero no persistido, `PersonName`, empresa opcional normalizada, `EmailAddress` y `PhoneNumber`. Su UUID no viene del frontend: Application/composition lo proporcionará al construir la Entity; Domain no lo genera.
- `ContactRequest` compone `Client`, `TipoSolicitud` (`SOLICITUD_INFORMACION` o `SOLICITUD_SERVICIO`), `requestedService` y mensaje opcional normalizado.
- El Aggregate no envía correo.
- Los futuros `IServicesReadPort`, `ICompanyProfileReadPort` e `IEmailSenderPort` se crearán solo con `SubmitContactRequestCommand`; actualmente no existen.
- El CMS (Strapi) no participa en este flujo.

## Reglas por capa

### Domain

- Contiene invariantes, comportamiento, Aggregates, Entities, Value Objects, Domain Events, excepciones y servicios justificados.
- No usa decoradores NestJS/TypeORM, validación HTTP ni detalles técnicos.
- Los Value Objects son inmutables, válidos desde su creación y comparados por valor.
- No crear Domain Exceptions para timeouts, correo, TypeORM, MySQL, filesystem, HTTP o proveedores.
- `Domain/Abstract` contiene solo interfaces reales con prefijo `I`. No admite clases abstractas, repositories, puertos técnicos, correo, storage, HTTP o DataSource.
- Las bases locales `ScalarValueObject` y `UuidValueObject` viven en `Domain/ValueObjects/Base`, nunca en `Abstract`.
- `UuidValueObject` normaliza y valida un UUID no vacío; no genera identidades ni importa `node:crypto`/`crypto`.
- La generación futura de UUID de negocio pertenece a Application/composition. No crear `IUuidGenerator`, `IIdGenerator` ni un port equivalente antes de que un caso de uso real lo necesite.
- Los mensajes propios de invariantes y excepciones de negocio se escriben en español.

### Application

- Organiza casos de uso reales por feature.
- Usa `@nestjs/cqrs`: Commands para acciones y Queries para lecturas sin efectos; despacha con `CommandBus` y `QueryBus`.
- Usar `CommandHandler` y `QueryHandler` de forma coherente; no crear CQRS o CRUD artificial por simetría ni Event Sourcing.
- Commands contienen solo entrada. Queries no escriben, mutan Aggregates ni envían correo.
- Declara ports por capacidad; no repositories genéricos.
- Valida entrada, existencia y precondiciones; Domain protege invariantes.
- No depende de TypeORM, MySQL, Nest controllers, el CMS (Strapi) o implementaciones concretas.
- En un CREATE o UPDATE administrativo de negocio (iniciado desde el CMS), el Command autoriza, rechaza o canonicaliza; no hace la escritura final. El detalle de la integración administrativa con Strapi (incluidos los DELETE) se definirá en la fase de integración; no crear casos de uso especulativos.
- Los ports externos requeridos por casos de uso viven en `Application/Ports`; las validaciones del caso de uso viven en `Application/Validations`.
- No crear interfaces o validaciones artificiales cuando todavía no exista un caso de uso consumidor; conservar la carpeta con `.gitkeep`.
- Todas las interfaces de Domain y Application usan prefijo `I`.

### Infrastructure

- Implementa TypeORM, persistencia MySQL, mappers, storage, correo y ports reales.
- Los Persistence Models, Mappers, Configurations y Migrations pertenecen al Bounded Context propietario.
- `Persistence Model != Domain Model`: los Persistence Models TypeORM viven aquí y se traducen mediante mappers.
- No agregar decoradores TypeORM a Domain.
- Las **TypeORM migrations** son la única autoridad estructural de las tablas de negocio y están registradas en el DataSource (crean/evolucionan su schema). Strapi no modela ni migra esas tablas. Prohibido `synchronize: true`; `synchronize` permanece `false` (ADR-027).
- Mantener un único `DataSource` MySQL. Cada módulo registra y consume únicamente sus propios Persistence Models; no crear conexiones por contexto ni FKs entre Bounded Contexts.
- El único DataSource técnico global vive en `backend/src/Infrastructure/Persistence`; `backend/src/Infrastructure` no es propietario de modelos o migrations de negocio.
- Mantener UUID como `CHAR(36)` ASCII/binario (legible e introspeccionable por un CMS futuro), tablas singulares `snake_case` y la portada única mediante `cover_marker`, columna generada nullable independiente de `project_id`, con `UNIQUE (project_id, cover_marker)`.
- Configurar constraints, índices, cardinalidades y delete behaviors cuando exista el modelo real.
- Evitar N+1; proyectar lecturas y no reconstruir Aggregates si un DTO basta.
- TypeORM puede leer estado durante un CREATE o UPDATE iniciado desde el CMS, pero no duplica su escritura final.
- `randomUUID()` puede usarse en Infrastructure para IDs puramente técnicos de persistencia; esa autorización no se extiende a Domain.

### Presentation

- Contiene controllers, mapping y respuestas HTTP cuando existen adaptadores de entrada reales.
- Delega por `CommandBus` o `QueryBus`; no contiene negocio ni consultas TypeORM.
- No expone Entities, stack traces, SQL, credenciales o detalles de proveedores.
- No inventar rutas; actualizar `README.md` y `docs/ENDPOINTS.md` con cada endpoint real.
- Los DTOs Request/Response de transporte HTTP viven en `{Context}.Presentation/DTOs` solo con una frontera real; los DTOs internos de persistencia/adaptadores viven en `{Context}.Commons/DTOs`. Domain no depende de ninguno.
- Los DTOs internos de CompanyProfile viven en `CompanyProfile.Commons/DTOs`; su Presentation contiene únicamente `Controllers` y `Mappers`. `SubmitContactRequestDto` permanece en `Contact.Presentation/DTOs` porque modela una futura frontera HTTP, aunque todavía no exista endpoint.

## CMS administrativo (Strapi) y propiedad del dominio

- La plataforma administrativa vigente es **Strapi 5**, incorporado como aplicación Node independiente en `infrastructure/CMS/Strapi/`; no es un Bounded Context, un módulo NestJS ni parte del build del backend (ADR-025). Directus fue retirado definitivamente; no reintroducirlo.
- Prohibido ubicar la aplicación CMS en `backend/src/Infrastructure/`, `backend/src/modules/`, o mezclarla con el backend. `backend/src/Infrastructure/` sigue siendo exclusivamente la capa interna del backend.
- **Strapi usa la MISMA base de datos MySQL** que el backend (ADR-027): las variables `STRAPI_DB_*` apuntan a la base `MYSQL_*` (por ejemplo `cromatica_prod`). No crear una segunda base. Compartir la conexión no implica ownership del schema.
- **Strapi gobierna únicamente sus tablas internas.** No debe crear, alterar, migrar ni modelar las tablas de negocio como content-types nativos; en una fase posterior las leerá/escribirá (datos, no estructura) mediante infraestructura custom. NestJS conserva las reglas de negocio (CREATE/UPDATE).
- Reparto de validación: Strapi = estructural (required, unique, min/max, formato, enums); NestJS = negocio (teléfono E.164, canonicalización, duplicados semánticos, invariantes cruzadas, unicidad compuesta, portada única, `end>=start`, `published⇒title`); MySQL = NOT NULL/UNIQUE/FK/tipos.
- Las cuentas, contraseñas, sesiones, roles y permisos administrativos pertenecen a Strapi. No crear `AuthModule`, login/JWT/usuarios/roles administrativos en NestJS ni login administrativo en React.
- Mantener deshabilitado el registro público. No habilitar registro abierto de administradores.
- El `.env` y los secretos de Strapi (`APP_KEYS`, `ADMIN_JWT_SECRET`, `API_TOKEN_SALT`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`, `ENCRYPTION_KEY`, credenciales `STRAPI_DB_*`) nunca se versionan.
- La PoC se ejecutará sobre el **Hostinger Business Web Hosting existente**. No afirmar que Strapi funciona en Hostinger ni que esa topología tiene soporte oficial hasta validarla.
- Flujo objetivo (mediante la futura infraestructura custom de Strapi): **GET** y **DELETE** los resuelve Strapi directo a MySQL; **CREATE/UPDATE con negocio** van Strapi → NestJS → payload canónico → Strapi → MySQL. Las TypeORM migrations gobiernan la estructura; NestJS evita la doble escritura y no es el escritor administrativo final. **La integración Strapi → NestJS (autenticación service-to-service, lifecycles) se implementará en una tarea posterior; no está implementada en esta fase.**
- En esta fase la frontera interna `/internal/cms/*` (`CompanyProfileCmsController`) **no está registrada** ni expuesta: su lógica de HU22–HU25 (Commands, Handlers, Strategies, Validators, `ICompanyProfileStateReader`) se conserva intacta como código de migración desacoplado del CMS anterior. No exponerla sin autenticación.
- `CmsInternalAuthGuard` y el Filter Hook/extension de Directus fueron eliminados. No recrearlos; la autenticación técnica del CMS se rediseñará en la fase de integración de Strapi.

## Frontend, contacto y seguridad

- El frontend no está implementado. Cuando se materialice, React + TypeScript + Vite se organiza mediante `app/`, `pages/`, `features/`, `components/`, `hooks/`, `services/`, `types/`, `utils/` y `assets/` según responsabilidades reales.
- React consumirá exclusivamente NestJS REST; nunca Strapi o MySQL.
- Centralizar HTTP en services/API clients; los tipos TypeScript modelan contratos o UI, no Entities del backend.
- No replicar artificialmente las capas del backend en React.
- El formulario usa `SubmitContactRequestCommand`; React nunca envía correo directamente.
- `From` es técnico, `To` procede de CompanyProfile y `Reply-To` del Cliente.
- Cliente sigue sin autenticación; no crear autenticación propia en V1.
- No exponer MySQL a Internet ni versionar secretos.
- La autenticación service-to-service CMS (Strapi) → NestJS se definirá en la fase de integración de Strapi (ADR-025); no introducir un mecanismo definitivo ni un login propio en NestJS en esta fase.
- Validar por nivel: React/Strapi UX, Presentation transporte, Application caso de uso, Domain invariantes, MySQL integridad.
- Domain Events solo para hechos relevantes; Integration Events solo con consumidor; no message brokers sin requisito.
- No almacenar multimedia como BLOB/base64 del modelo de dominio; storage sigue pendiente.

## Calidad y decisiones abiertas

- Consultar `docs/DEVELOPMENT.md` antes de agregar feature, módulo, entidad o migration.
- Mantener `docs/ARCHITECTURE.md` como fuente de verdad y la documentación coherente con el estado real.
- Agregar tests proporcionales cuando exista tooling y mantener Domain libre de I/O/frameworks.
- NestJS, Domain TypeScript y TypeORM/MySQL tienen una fundación compilable y probada. HU22 añade el primer caso de uso Application, controller interno y endpoint; fuera de HU22 no hay más casos de uso, controllers de negocio ni endpoints públicos, ni frontend.
- Strapi está incorporado/configurado como CMS administrativo, pero siguen abiertas la PoC en Hostinger, la integración administrativa custom Strapi → NestJS, la autenticación service-to-service, los permisos CRUD finos, storage, correo, antiabuso, historial de ContactRequest, exposición de ProjectPeriod, efecto de desactivar categorías y operación.
- Registrar toda decisión aprobada en `docs/DECISIONS.md`.
