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
- [x] Aprobar TypeORM/MySQL y migrations como autoridad estructural.
- [x] Aprobar React/TypeScript/Vite como frontend objetivo.
- [x] Definir el Hostinger Business Web Hosting existente como entorno objetivo de evaluación.
- [x] Mantener Directus provisional y definir su PoC obligatoria.
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
- [ ] Verificar que React nunca acceda a Directus o MySQL.

## Fase 4.5 — HU09 autenticación local de Directus

- [x] Incorporar Directus `12.3.0` como aplicación Node.js `>=22` independiente en `infrastructure/CMS/Directus/`.
- [x] Versionar scripts oficiales `directus bootstrap` y `directus start`, `.env.example` seguro, lockfile y directorios reservados de extensions/uploads.
- [x] Configurar conceptualmente `DB_HOST/DB_PORT/DB_DATABASE` para la misma `MYSQL_HOST/MYSQL_PORT/MYSQL_DATABASE`, sin segunda base.
- [x] Mantener TypeORM Migrations como autoridad de las diez tablas de negocio y el bootstrap de Directus como autoridad exclusiva de `directus_*`.
- [x] Mantener autenticación administrativa exclusivamente en Directus, sin AuthModule/JWT/endpoints NestJS y sin login React.
- [x] No agregar configuración que habilite el registro público y documentar que Directus lo deshabilita por defecto.
- [x] Preparar recuperación nativa; envío SMTP real no configurado ni verificado.
- [ ] Ejecutar TypeORM Migrations contra MySQL real. Configurado, pendiente de verificación manual si el entorno no ofrece instancia/credenciales.
- [ ] Ejecutar bootstrap Directus y comprobar sus tablas internas. Configurado, pendiente de verificación manual si el entorno no ofrece instancia/credenciales.
- [ ] Crear y comprobar el Administrador inicial. Configurado, pendiente de verificación manual si el entorno no ofrece instancia/credenciales.
- [ ] Iniciar Data Studio y comprobar login válido. Configurado, pendiente de verificación manual si el entorno no ofrece instancia/credenciales.
- [ ] Comprobar rechazo de contraseña incorrecta y usuario inexistente. Configurado, pendiente de verificación manual si el entorno no ofrece instancia/credenciales.
- [ ] Comprobar en ejecución que el registro público permanezca deshabilitado. Configurado, pendiente de verificación manual si el entorno no ofrece instancia/credenciales.
- [ ] Comprobar introspección de las diez tablas TypeORM sin alterar su esquema. Configurado, pendiente de verificación manual si el entorno no ofrece instancia/credenciales.

## Fase 4.6 — HU22 agregar información de contacto

- [x] Modelar el caso de uso orientado al negocio `AgregarInformacionDeContactoCommand` con un contrato de entrada abierto (`IEntradaInformacionDeContacto`, sin enum ni unión cerrada de medios), sin handler CMS genérico ni `switch` por colección en Application.
- [x] Implementar `AgregarInformacionDeContactoCommandHandler` como orquestador (puerto de lectura → validadoras → Value Objects → Aggregate → payload canónico), sin TypeORM ni escritura.
- [x] Definir el contrato `IValidadora` y `ValidadoraTelefono` con `libphonenumber-js`, canonicalizando a E.164; conservar validez intrínseca en Value Objects y unicidad en el Aggregate.
- [x] Integrar el correo receptor en `AgregarInformacionDeContactoCommand` mediante `AgregarCorreoReceptorStrategy`; compartir una sola `ValidadoraCorreo` con el correo público y eliminar el Command/Handler de validación paralelo.
- [x] Crear el puerto de solo lectura `ICompanyProfileStateReader` y su adaptador TypeORM (evidencia de escritor único).
- [x] Exponer el endpoint interno `POST /internal/cms/company-profile/contact-information` con DTOs y Mapper de Presentation.
- [x] Resolver ADR-023: token técnico `Bearer` y `CmsInternalAuthGuard` con comparación de tiempo constante y fail closed.
- [x] Implementar el Filter Hook bloqueante de Directus para `phone`/`email`/`social_link` create (fail closed). El update del correo receptor se intercepta por separado y HU23 incorpora los updates de children; los DELETE no se interceptan conforme a ADR-019.
- [x] Documentar variables `CMS_INTERNAL_TOKEN`, `BACKEND_INTERNAL_URL`, `BACKEND_INTERNAL_TOKEN` en los `.env.example`.
- [x] Agregar tests unitarios de teléfono, handler, guard y hook; `npm test` en verde y `npm audit` del backend sin vulnerabilidades.
- [ ] Verificación E2E real (MySQL + NestJS + Directus) del flujo canónico y fail closed. Pendiente de entorno con instancia/credenciales.
- [x] HU23 "Modificar información de contacto": un único `ModificarInformacionDeContactoCommand`+Handler orquestador (sin switch) con `ModificarTelefono/Correo/RedSocialStrategy` (mismo OCP y mismas validaciones que Agregar). El Aggregate expone `changePhone/changeEmail/changeSocialLink` (reemplazo por valor, duplicado excluyendo el propio registro); el id→valor se resuelve en Infrastructure (`IChildActualReader`) sin introducir ids en el Domain. Endpoint `/contact-information/modify`, Hook `phone|email|social_link.items.update`, y UI con lápiz de edición. Tests en verde.
- [x] Alinear ADR-019 y la documentación con la decisión vigente: CREATE/UPDATE pasan por Hook/NestJS y DELETE se ejecuta directamente en Directus, sin endpoints ni casos de uso backend mientras no existan reglas de negocio adicionales.

## Fase 4.7 — HU24 agregar ubicación

- [x] Modelar el caso de uso `AgregarUbicacionCommand` orientado al negocio (`direccion`/`latitud`/`longitud`), sin Strategy (flujo único) ni handler CMS genérico.
- [x] Implementar `AgregarUbicacionCommandHandler` como orquestador: reutiliza `ICompanyProfileStateReader` (solo lectura), rechaza si el perfil no existe o si ya hay ubicación (cardinalidad 0..1, sin sobrescribir), construye `Address`/`GeoCoordinates`/`CompanyLocation` y devuelve el resultado canónico; no persiste.
- [x] Crear `Exceptions/UbicacionRechazadaException` traduciendo `InvalidValueObjectException`/`InvalidGeoCoordinatesException`; conservar las invariantes en los Value Objects (sin validadoras duplicadas).
- [x] Exponer el endpoint interno `POST /internal/cms/company-profile/location` con DTOs y `AgregarUbicacionMapper`; el `company_profile_id` procede del Aggregate y se protege del Administrador.
- [x] Extender la extensión `extensions/company-profile/` con `location.items.create` (ruta explícita, Bearer ADR-023, fail closed), sin crear otra extensión. HU25 incorpora `location.items.update`; DELETE no se intercepta conforme a ADR-019.
- [x] No almacenar enlace de Google Maps ni generar UUID para la ubicación; reutilizar la tabla `location` existente sin migration nueva.
- [x] Agregar tests de `Address` (obligatoria, vacía, mínimo 10, máximo 500 y límites exactos), handler (válido, canónico, dirección trivial, coordenadas fuera de rango, ubicación existente, perfil inexistente, single writer), mapper y hook de ubicación; `npm test` en verde.
- [ ] Verificación E2E real (MySQL + NestJS + Directus) de la creación de ubicación, rechazo de segunda ubicación y fail closed. Pendiente de entorno con instancia/credenciales.
- [x] Configuración de UI de Directus con buscador y mapa Leaflet/OpenStreetMap que rellena `latitude`/`longitude`; la dirección permanece manual.
- [x] HU25 "Modificar ubicación": `ModificarUbicacionCommand`+Handler (flujo único, sin Strategy) que reutiliza `Address`/`GeoCoordinates` y completa los campos ausentes con el estado actual; endpoint `/location/modify`, Hook `location.items.update`, y UI de edición con el mapa centrado en las coordenadas actuales. Tests en verde.

## Fase 5 — PoC de Directus en Hostinger

Directus permanece provisional hasta completar todos los puntos:

- [ ] Verificar ejecución de Node.js 22 en el Hostinger Business Web Hosting existente.
- [ ] Verificar conexión a MySQL de Hostinger.
- [ ] Inicializar tablas internas de Directus.
- [ ] Verificar Data Studio.
- [ ] Introspeccionar tablas del dominio creadas externamente.
- [ ] Ejecutar Filter Hooks bloqueantes de CREATE/UPDATE.
- [ ] Verificar llamada Hook → NestJS.
- [ ] Verificar aprobación y rechazo de CREATE/UPDATE.
- [ ] Verificar canonicalización del payload.
- [ ] Verificar persistencia posterior a aprobación.
- [ ] Probar ausencia de doble escritura.
- [ ] Verificar persistencia y comportamiento de uploads.
- [ ] Verificar carga de extensions.
- [ ] Verificar que uploads/extensions sobrevivan reinicio o redeploy.
- [ ] Documentar evidencia, riesgos y límites observados.
- [ ] Adoptar Directus mediante actualización de ADR-018 o, si falla, reconsiderar CMS en una nueva ADR sin asumir alternativa.

## Fase 6 — Integración administrativa, condicionada a PoC

- [x] Completar ADR-023 y definir la autenticación técnica Directus → NestJS (token `Bearer`, resuelto en HU22). La autorización de permisos finos sigue pendiente.
- [ ] Configurar mínimo privilegio para Administradores.
- [ ] Implementar endpoints internos sin inventar doble canal de persistencia.
- [ ] Implementar Filter Hooks para los CREATE/UPDATE de cada operación/colección necesaria; DELETE permanece directo en Directus.
- [ ] Probar error, aprobación, payload canónico y escritor final único en CREATE/UPDATE, además de autenticación, autorización y confirmación de DELETE en Directus.
- [ ] Confirmar que TypeORM Migrations siga siendo autoridad estructural.
- [ ] Definir storage y operación de multimedia.
- [ ] Probar flujo editorial completo.

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

- Resultado y decisión final de la PoC de Directus.
- Estructura física del frontend futuro.
- Versiones distintas de Node.js 22.
- Permisos CRUD finos del CMS (la autenticación Directus → NestJS quedó resuelta en ADR-023).
- Rutas, versionado, DTOs y estrategia de errores HTTP.
- Límites transaccionales y concurrencia.
- Efecto de desactivar Service/Category sobre Projects históricos.
- Exposición de ProjectPeriod.
- Storage de multimedia y videos externos.
- Proveedor/configuración de correo y política antiabuso.
- Persistencia histórica de ContactRequest.
- Formatter, lint, testing futuro de Application/API/frontend, observabilidad, caching y operación.

No son decisiones pendientes: cuentas de Cliente, autenticación propia, roles propios del backend y panel administrativo React están fuera de la V1.
