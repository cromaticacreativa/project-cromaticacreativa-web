# Roadmap

El roadmap no asigna fechas. Solo se marca completado lo que existe y fue verificado.

## Estado heredado — conservado en Git

- [x] Existe la solución .NET y separación física previa por capas.
- [x] Existe Domain en Portfolio, Services, CompanyProfile y Contact.
- [x] Existen Persistence Models, configuraciones, mappers, tres `DbContext` y EF Migrations para Portfolio, Services y CompanyProfile.
- [x] Contact permanece sin persistencia histórica.
- [x] Migrar el comportamiento de Domain a TypeScript y retirar .NET/EF/PostgreSQL del árbol activo.

Estos elementos explican la historia; no forman parte del árbol activo.

## Fase 0 — Arquitectura objetivo

- [x] Mantener monorepo, monolito modular, DDD pragmático y arquitectura hexagonal.
- [x] Mantener los Bounded Contexts Portfolio, Services, CompanyProfile y Contact.
- [x] Aprobar Node.js 22, TypeScript y NestJS como backend objetivo.
- [x] Aprobar `@nestjs/cqrs` para CommandBus/QueryBus.
- [x] Aprobar TypeORM/MySQL y migrations como autoridad estructural de las tablas de negocio (ADR-027).
- [x] Aprobar React/TypeScript/Vite como frontend objetivo.
- [x] Definir el Hostinger Business Web Hosting existente como entorno objetivo de evaluación.
- [x] Definir el CMS administrativo (Strapi 5) provisional y su PoC obligatoria; retirar Directus (ADR-025). Base MySQL **única compartida** con ownership separado: TypeORM migrations gobiernan las tablas de negocio; Strapi solo sus tablas internas (ADR-027).
- [x] Documentar Filter Hook bloqueante y escritor final único como diseño condicionado a la PoC.

## Fase 1 — Fundación Node.js/NestJS

- [x] Crear la aplicación Node.js 22 + TypeScript + NestJS.
- [x] Definir estructura física bajo `src/modules/{Context}` con carpetas `{Context}.{Layer}` y Commons local.
- [x] Configurar los cuatro módulos y Dependency Injection de NestJS.
- [x] Incorporar `@nestjs/cqrs` sin casos de uso ficticios.
- [x] Materializar Domain, Application, Infrastructure y Presentation con dependencias correctas.
- [x] Materializar `Domain/Abstract`, `Application/Ports`, `Application/Validations`, `Infrastructure/Persistence`, Presentation y `{Context}.Commons/DTOs`.
- [x] Reservar `Domain/Abstract` exclusivamente para interfaces `I*` y mover bases de Value Objects a `ValueObjects/Base`.
- [x] Migrar Domain preservando invariantes, igualdad por valor y ownership respecto al C# histórico.
- [x] Mantener Domain libre de `node:crypto`: `UuidValueObject` valida UUID explícitos y no genera identidades.
- [x] Retirar `shared/domain`, `src/database` y agrupaciones de conceptos.
- [ ] Crear contratos `public/` solo cuando exista un consumidor.
- [x] Definir configuración y ejemplo seguro de entorno para MySQL.
- [x] Configurar tests con `node:test`; formatter y lint continúan pendientes hasta una necesidad real.

## Fase 2 — TypeORM y MySQL

- [x] Configurar conexión MySQL y TypeORM.
- [x] Implementar un único DataSource técnico.
- [x] Crear diez Persistence Models separados de Domain dentro de sus módulos.
- [x] Definir diez DTOs de persistencia planos en los Commons locales y usarlos como contratos de entrada de los mappers.
- [x] Implementar cinco mappers Domain ↔ Persistence.
- [x] Definir tablas singulares `snake_case`, UUID `CHAR(36)` ASCII/binario y nombres explícitos de constraints.
- [x] Configurar PK, FK internas, `NOT NULL`, `UNIQUE`, checks, índices, cardinalidades y delete behaviors.
- [x] Evitar FKs/dependencias técnicas cruzadas entre Bounded Contexts.
- [x] Configurar TypeORM Migrations y mantener `synchronize: false`.
- [x] Dividir y revisar migrations iniciales por Portfolio, Services y CompanyProfile.
- [x] Proteger físicamente la portada única de Project mediante `cover_marker` generado nullable y `UNIQUE (project_id, cover_marker)`.
- [ ] Probar migrations sobre MySQL.
- [x] Mantener ContactRequest sin tabla ni migration funcional.
- [x] Modelar `Client` como Entity efímera con identidad interna y componerla dentro de `ContactRequest`.
- [x] Sustituir el enum anterior por `TipoSolicitud` con los dos valores aprobados.
- [x] Refactorizar CompanyProfile a colecciones públicas de phones/emails, WhatsApp como SocialLink y CompanyLocation sin identidad Domain.
- [x] Ajustar los cinco modelos, DTOs, mapper y migration inicial de CompanyProfile al esquema relacional final.
- [x] Verificar metadata TypeORM, SQL de migrations y mappers sin conexión.
- [ ] Agregar integración contra una instancia MySQL real.

## Fase 3 — API y CQRS

- [ ] Definir primeros contratos REST reales.
- [ ] Implementar Queries públicas y read ports con proyecciones sin N+1.
- [ ] Implementar Commands reales con Command Handlers.
- [ ] Generar/proporcionar IDs desde Application/composition al implementar los casos de uso que creen objetos con identidad.
- [ ] Exponer Services Active y categorías Active con padre Active.
- [ ] Exponer Projects publicados y filtros Service/Category.
- [ ] Decidir exposición pública de ProjectPeriod.
- [ ] Crear `Services/public/` y `CompanyProfile/public/` cuando Contact/Portfolio los necesiten.
- [ ] Implementar `SubmitContactRequestCommand`.
- [x] Materializar únicamente el tipo plano `SubmitContactRequestDto` como frontera futura de Presentation.
- [ ] Crear `IServicesReadPort`, `ICompanyProfileReadPort`, `IEmailSenderPort` y `ContactEmailDto` junto con el caso de uso real.
- [ ] Seleccionar proveedor de correo e implementar el port/adaptador.
- [ ] Definir antiabuso, límites y observabilidad del formulario.
- [ ] Mantener cero endpoints documentados hasta que exista el primero.
- [ ] Agregar tests de Application y contratos HTTP.

## Fase 4 — Frontend React/Vite

- [ ] Crear React + TypeScript con Vite en una tarea posterior; actualmente `frontend/` no existe.
- [ ] Definir Pages, features, components, hooks, services y types por responsabilidades reales.
- [ ] Centralizar el cliente HTTP hacia NestJS.
- [ ] Implementar contenido institucional estático.
- [ ] Implementar Services y categorías activas.
- [ ] Implementar Portfolio y filtros públicos.
- [ ] Implementar CompanyProfile.
- [ ] Implementar formulario público y selector de Services.
- [ ] Cubrir accesibilidad, responsive, carga, vacío y error.
- [ ] Verificar que React nunca acceda a Strapi o MySQL.

## Fase 4.5 — CMS administrativo (Strapi)

> Directus fue retirado definitivamente (ADR-025). Strapi 5 es la plataforma administrativa vigente, sobre una base MySQL **única compartida** con el backend; las TypeORM migrations gobiernan las tablas de negocio y Strapi solo sus tablas internas (ADR-027).

- [x] Retirar Directus del árbol activo (extensions, hooks, branding, seeds, guard, variables y tokens específicos).
- [x] Incorporar **Strapi 5** (TypeScript) como aplicación Node independiente en `infrastructure/CMS/Strapi/`, con MySQL/MariaDB (sin SQLite).
- [x] Versionar scripts oficiales (`build`, `develop`, `start`), `tsconfig.json`, `config/*`, `.env.example` seguro y lockfile.
- [x] Configurar Strapi contra la base MySQL **única compartida** con el backend mediante variables `STRAPI_DB_*` (que apuntan a `MYSQL_*`); sin segunda base (ADR-027).
- [x] Mantener las TypeORM migrations registradas como autoridad estructural de las tablas de negocio; Strapi gobierna solo sus tablas internas (ADR-027).
- [x] Mantener autenticación administrativa exclusivamente en Strapi, sin AuthModule/JWT/endpoints NestJS y sin login React.
- [x] No agregar configuración que habilite el registro público.
- [x] Verificar `npm install` y `npm run build` de Strapi sin base de datos.
- [ ] Ejecutar Strapi (`npm run develop`/`start`) contra su base real y crear el primer Administrador. Configurado, pendiente de verificación manual si el entorno no ofrece instancia/credenciales.
- [ ] Comprobar login válido, rechazo de credenciales inválidas y registro público deshabilitado en ejecución. Pendiente de verificación manual.
- [x] Descartar los content-types Strapi de negocio (ADR-026 revertida): las tablas de negocio no se modelan como content-types; las gobiernan las TypeORM migrations (ADR-027).
- [ ] Ejecutar Strapi contra MySQL real y verificar que crea únicamente sus tablas internas sin tocar las de negocio. Pendiente de entorno.

## Fase 4.6 — HU22 agregar información de contacto

> La lógica de negocio (Commands, Handlers, Strategies, Validadoras, Value Objects, Aggregate y la frontera HTTP interna) permanece **intacta**. Los artefactos específicos de Directus (Filter Hook, `CmsInternalAuthGuard`, extension, UI) fueron **retirados** con la migración a Strapi (ADR-025); la frontera interna quedó sin registrar, pendiente de la integración con Strapi.

- [x] Modelar el caso de uso orientado al negocio `AgregarInformacionDeContactoCommand` con un contrato de entrada abierto (`IEntradaInformacionDeContacto`, sin enum ni unión cerrada de medios), sin handler CMS genérico ni `switch` por colección en Application.
- [x] Implementar `AgregarInformacionDeContactoCommandHandler` como orquestador (puerto de lectura → validadoras → Value Objects → Aggregate → payload canónico), sin TypeORM ni escritura.
- [x] Definir el contrato `IValidadora` y `ValidadoraTelefono` con `libphonenumber-js`, canonicalizando a E.164; conservar validez intrínseca en Value Objects y unicidad en el Aggregate.
- [x] Integrar el correo receptor en `AgregarInformacionDeContactoCommand` mediante `AgregarCorreoReceptorStrategy`; compartir una sola `ValidadoraCorreo` con el correo público y eliminar el Command/Handler de validación paralelo.
- [x] Crear el puerto de solo lectura `ICompanyProfileStateReader` y su adaptador TypeORM (evidencia de escritor único).
- [x] Definir la frontera interna `POST /internal/cms/company-profile/contact-information` con DTOs y Mapper de Presentation (lógica conservada; controller no registrado en esta fase).
- [~] Autenticación service-to-service: `CmsInternalAuthGuard` (ADR-023) fue retirado con Directus; la protección del CMS (Strapi) → NestJS se rediseñará en la fase de integración (ADR-025).
- [~] Filter Hook de Directus retirado (ADR-025). El re-registro de la frontera y la integración con Strapi son de una fase posterior.
- [x] Documentar la variable `CMS_INTERNAL_TOKEN` (neutra, reservada para la futura integración Strapi → NestJS) en `.env.example`; eliminar las variables específicas de Directus.
- [x] Agregar tests unitarios de teléfono, handler, mapper y controller; `npm test` en verde y `npm audit` del backend sin vulnerabilidades. (Los tests de guard y hook de Directus se eliminaron con Directus.)
- [ ] Verificación E2E real (MySQL + NestJS + integración Strapi) del flujo canónico. Pendiente de la fase de integración y de entorno con instancia/credenciales.
- [x] HU23 "Modificar información de contacto": un único `ModificarInformacionDeContactoCommand`+Handler orquestador (sin switch) con `ModificarTelefono/Correo/RedSocialStrategy` (mismo OCP y mismas validaciones que Agregar). El Aggregate expone `changePhone/changeEmail/changeSocialLink` (reemplazo por valor, duplicado excluyendo el propio registro); el id→valor se resuelve en Infrastructure (`IChildActualReader`) sin introducir ids en el Domain. Frontera `/contact-information/modify` (lógica conservada). Tests en verde.
- [x] Alinear ADR-019/ADR-025 y la documentación con la decisión vigente: las mutaciones de negocio CREATE/UPDATE pasan por NestJS/Application/Domain; el mecanismo concreto de integración con Strapi se definirá en una fase posterior.

## Fase 4.7 — HU24 agregar ubicación

- [x] Modelar el caso de uso `AgregarUbicacionCommand` orientado al negocio (`direccion`/`latitud`/`longitud`), sin Strategy (flujo único) ni handler CMS genérico.
- [x] Implementar `AgregarUbicacionCommandHandler` como orquestador: reutiliza `ICompanyProfileStateReader` (solo lectura), rechaza si el perfil no existe o si ya hay ubicación (cardinalidad 0..1, sin sobrescribir), construye `Address`/`GeoCoordinates`/`CompanyLocation` y devuelve el resultado canónico; no persiste.
- [x] Crear `Exceptions/UbicacionRechazadaException` traduciendo `InvalidValueObjectException`/`InvalidGeoCoordinatesException`; conservar las invariantes en los Value Objects (sin validadoras duplicadas).
- [x] Definir la frontera interna `POST /internal/cms/company-profile/location` con DTOs y `AgregarUbicacionMapper`; el `company_profile_id` procede del Aggregate y se protege del Administrador (lógica conservada; no registrada en esta fase).
- [~] La extensión de Directus para `location` fue retirada (ADR-025); la UI del mapa (Leaflet/OpenStreetMap) y la integración se replantearán en la fase de Strapi.
- [x] No almacenar enlace de Google Maps ni generar UUID para la ubicación; reutilizar la tabla `location` existente sin migration nueva.
- [x] Agregar tests de `Address` (obligatoria, vacía, mínimo 10, máximo 500 y límites exactos), handler (válido, canónico, dirección trivial, coordenadas fuera de rango, ubicación existente, perfil inexistente, single writer) y mapper de ubicación; `npm test` en verde. (El test del hook de Directus se eliminó con Directus.)
- [ ] Verificación E2E real (MySQL + NestJS + integración Strapi) de la creación de ubicación y rechazo de segunda ubicación. Pendiente de la fase de integración y de entorno.
- [x] HU25 "Modificar ubicación": `ModificarUbicacionCommand`+Handler (flujo único, sin Strategy) que reutiliza `Address`/`GeoCoordinates` y completa los campos ausentes con el estado actual; frontera `/location/modify` (lógica conservada). Tests en verde.

## Fase 5 — PoC de Strapi en Hostinger

Strapi permanece provisional hasta completar todos los puntos:

- [ ] Verificar ejecución de Node.js 22 como aplicación Node administrada en el Hostinger Business Web Hosting existente.
- [ ] Verificar conexión a la base MySQL/MariaDB **única compartida** con el backend.
- [ ] Inicializar las tablas internas de Strapi (bootstrap) en la base compartida, sin tocar las tablas de negocio.
- [ ] Verificar el panel de administración.
- [ ] Verificar autenticación de administradores y roles/permisos.
- [ ] Verificar `npm run build` y arranque (`npm run start`) en el entorno.
- [ ] Verificar persistencia y comportamiento de uploads.
- [ ] Verificar que uploads y configuración sobrevivan reinicio o redeploy.
- [ ] Documentar evidencia, riesgos y límites observados.
- [ ] Adoptar Strapi mediante actualización de ADR-025 o, si falla, reconsiderar CMS en una nueva ADR sin asumir alternativa.

## Fase 6 — Integración administrativa Strapi → NestJS (CompanyProfile)

> Alcance: **solo CompanyProfile / Información General**. Portfolio y Services siguen pendientes.

Backend (implementado y probado):

- [x] Autenticación service-to-service CMS (Strapi) → NestJS: `CmsServiceAuthGuard` (token técnico `Bearer CMS_INTERNAL_TOKEN`, comparación de tiempo constante, fail closed; no autentica personas).
- [x] Re-registrar `CompanyProfileCmsController` en `CompanyProfileModule` protegido por ese Guard; solo CREATE/UPDATE.
- [x] Cubrir el hueco del singleton: `InicializarCompanyProfileCommand` + Handler + endpoint `POST /internal/cms/company-profile/initialize` (crea el perfil cuando no existe; 409 si ya existe).
- [x] Tests: `CmsServiceAuthGuard` (token válido/ausente/mal formado/incorrecto/env ausente) y controller (guard aplicado, dispatch, respuesta canónica, conflicto). `npm test` en verde (120).

Strapi server-side (implementado, cargado por el build y verificado por arranque real):

- [x] Lógica en `src/company-profile/server/` (compilada por `strapi build` vía `src/index.ts`; ya NO en `src/plugins/**` excluido). Repositorio Knex interno parametrizado, cliente NestJS fail-closed, servicio de orquestación.
- [x] Wiring de runtime: `src/index.ts` `register()` monta rutas **admin** (`type: 'admin'`) vía `strapi.server.routes(...)`; instancia el servicio con `strapi.db.connection`.
- [x] **RBAC de servidor real**: cada ruta exige `admin::isAuthenticatedAdmin` + `admin::hasPermissions` con la acción `admin::company-profile.{read,create,update,delete}`. Acciones registradas en `bootstrap()` (verificado en arranque: log "Acciones RBAC registradas"); si el registro fallara, se emite `log.error` visible y las rutas niegan a no-Super-Admin (fail closed).
- [x] Rutas: GET informacion-general, GET geocode, POST initialize, PUT recipient-email, CRUD de phones/emails/social-links, CRUD de location. GET/DELETE directos a MySQL; CREATE/UPDATE vía NestJS.
- [x] Admin UI React "Información General" (`src/admin/app.tsx` + `src/admin/pages/InformacionGeneral.tsx`): menú (permiso read), 5 bloques con estados loading/error/empty/saving/success, confirmación de delete, errores inline, responsive; **botones ocultos según permisos** (create/update/delete) vía `useRBAC`.
- [x] OpenStreetMap: búsqueda **solo con botón "Buscar"** (no autocomplete) vía proxy server-side (`/company-profile/geocode` → Nominatim con User-Agent/throttle/timeout y **cache en memoria acotado** TTL 24h/máx 200 por query normalizada), mapa OSM embebido con marcador, entrada manual. Solo se guardan address/latitude/longitude.
- [x] Robustez: DELETE/UPDATE validan UUID (400 si inválido); UPDATE distingue registro inexistente (404) de update idempotente (éxito) re-verificando existencia; errores de constraint MySQL (UNIQUE/FK/CHECK) traducidos a seguros.
- [x] Branding Cromática: assets recuperados del historial git a `assets/branding/`; logo, favicon y paleta (`#7C3AED`) aplicados al menú, login y tema. `palette.md` sin referencias a Directus.
- [x] Tests server-side (`npm run test:server`, 31): repositorio, cliente, servicio (fail-closed, canónico, delete 404, UUID, update inexistente/idempotente), geocoding (cache/TTL/límite/normalización), errores/HTTP y config de rutas RBAC.
- [x] Verificación de arranque real: Strapi inicia contra MySQL, registra las acciones RBAC y las rutas responden **401** sin admin y **404** en rutas inexistentes.
- [ ] Marcador OSM arrastrable/click-to-set (mejora con react-leaflet); hoy el punto se fija por búsqueda o entrada manual.
- [ ] E2E autenticado por navegador (click-through) y RBAC con rol limitado: pendiente de credenciales de admin (la BD ya tiene un Super Admin cuyo password no está disponible en este entorno).
- [ ] Definir storage y operación de multimedia.

## Fase 7 — Calidad y deployment

- [x] Probar invariantes de Domain, igualdad, mappers, metadata y arquitectura física de la fundación.
- [ ] Completar tests de integración MySQL, Application, API y frontend cuando existan esas capacidades.
- [ ] Probar DTOs y constraints contra MySQL real.
- [ ] Verificar rendimiento y eliminar N+1.
- [ ] Configurar secretos y variables por entorno.
- [ ] Definir backups y restauración de datos/uploads.
- [ ] Configurar HTTPS, health checks y observabilidad según necesidad.
- [ ] Documentar migraciones, operación, rollback y recuperación.
- [ ] Validar deployment de NestJS y React en el Hostinger Business Web Hosting existente.

## Decisiones pendientes

- Resultado y decisión final de la PoC de Strapi.
- Integración administrativa custom Strapi → NestJS y su autenticación service-to-service.
- Estructura física del frontend futuro.
- Versiones distintas de Node.js 22.
- Permisos CRUD finos del CMS (Strapi).
- Rutas, versionado, DTOs y estrategia de errores HTTP.
- Límites transaccionales y concurrencia.
- Efecto de desactivar Service/Category sobre Projects históricos.
- Exposición de ProjectPeriod.
- Storage de multimedia y videos externos.
- Proveedor/configuración de correo y política antiabuso.
- Persistencia histórica de ContactRequest.
- Formatter, lint, testing futuro de Application/API/frontend, observabilidad, caching y operación.

No son decisiones pendientes: cuentas de Cliente, autenticación propia, roles propios del backend y panel administrativo React están fuera de la V1.
