# Desarrollo

Esta guía describe el desarrollo sobre la fundación Node.js/NestJS activa.

## Estado del entorno y transición

El backend posee `package.json` y `package-lock.json`. NestJS, `@nestjs/cqrs`, TypeORM/MySQL, Domain TypeScript y tests están configurados. **Strapi 5** es el CMS administrativo, incorporado en `infrastructure/CMS/Strapi/` como aplicación Node independiente que comparte **la misma base MySQL** del backend pero gobierna solo sus tablas internas; las **TypeORM migrations** (registradas, `synchronize: false`) son la autoridad estructural de las tablas de negocio (ADR-025 y ADR-027). Directus fue retirado. HU22–HU25 son los primeros casos de uso Application reales de CompanyProfile y su lógica permanece intacta; su frontera HTTP interna (`/internal/cms/company-profile/*`) existe pero **no está registrada** en esta fase, pendiente de la integración con Strapi. No existen todavía endpoints públicos. El frontend no está implementado.

La implementación .NET/EF/PostgreSQL anterior fue retirada después de comprobar la equivalencia y solo permanece en Git/ADRs históricas.

Antes de cambiar código:

1. leer `AGENTS.md` y la documentación afectada;
2. comprobar estado de Git y estructura real;
3. identificar el Bounded Context propietario;
4. confirmar el caso de uso y sus fronteras;
5. seguir patrones existentes, sin inventar scripts o infraestructura.

## Flujo futuro de una feature

1. Definir resultado, entradas, errores y consumidor.
2. Identificar `Portfolio`, `Services`, `CompanyProfile` o `Contact`.
3. Modelar invariantes reales en Domain.
4. Crear el Command o Query solo si existe el caso de uso.
5. Declarar ports mínimos en Application.
6. Implementar adaptadores y mappings en Infrastructure.
7. Exponer HTTP mediante un controller NestJS si corresponde.
8. Agregar tests proporcionales al riesgo.
9. Revisar seguridad, N+1, límites modulares y escritor único.
10. Actualizar documentación y roadmap con el estado verificado.

## Ubicación de cada artefacto

| Artefacto | Ubicación |
| --- | --- |
| Aggregate Root | `modules/{Context}/{Context}.Domain/Aggregates/{Name}.ts` |
| Domain Entity | `modules/{Context}/{Context}.Domain/Entities/{Name}.ts` |
| Value Object | `modules/{Context}/{Context}.Domain/ValueObjects/{Name}.ts` |
| Interfaz genuina de Domain | `modules/{Context}/{Context}.Domain/Abstract/I{Name}.ts` |
| Command / Query / Handler | `modules/{Context}/{Context}.Application/Commands` o `Queries` |
| Port o interfaz consumida por Application | `modules/{Context}/{Context}.Application/Ports/I{Name}.ts` |
| Strategy de un caso de uso (implementación) | `modules/{Context}/{Context}.Application/Strategies/{Name}Strategy.ts` |
| Validación de caso de uso (implementación) | `modules/{Context}/{Context}.Application/Validations/{Name}.ts` |
| Excepción propia de Application | `modules/{Context}/{Context}.Application/Exceptions/{Name}Exception.ts` |
| Implementación de un Port | `modules/{Context}/{Context}.Infrastructure/Adapters` o `Persistence` |
| Persistence Model | `modules/{Context}/{Context}.Infrastructure/Persistence/Models/{Name}PersistenceModel.ts` |
| Mapper Domain ↔ Persistence | `modules/{Context}/{Context}.Infrastructure/Persistence/Mappers/{Name}Mapper.ts` |
| Configuración persistente | `modules/{Context}/{Context}.Infrastructure/Persistence/Configurations/{Name}.ts` |
| Migration | `modules/{Context}/{Context}.Infrastructure/Persistence/Migrations/{Change}.ts` |
| Controller / mapper HTTP | `modules/{Context}/{Context}.Presentation/Controllers` o `Mappers` |
| Request/Response DTO HTTP | `modules/{Context}/{Context}.Presentation/DTOs/{Name}Dto.ts` |
| DTO interno de adaptador/persistencia | `modules/{Context}/{Context}.Commons/DTOs/{Name}Dto.ts` |

`Domain/Abstract` contiene solo interfaces con prefijo `I`; las clases base de Value Objects permanecen en `Domain/ValueObjects/Base`. Un Presentation DTO modela transporte HTTP; un Commons DTO es un contrato plano interno entre adaptadores/mappers, no HTTP. Domain no depende de ninguno. `Application/Ports` define una necesidad real e Infrastructure la implementa. No crear artefactos únicamente para llenar carpetas.

Al crear un Aggregate o Entity con identidad, Application/composition genera o proporciona primero el UUID y Domain recibe el ID válido, por ejemplo `new ProjectId(uuid)`. `UuidValueObject` valida la identidad, no la genera. No crear `IUuidGenerator`, `IIdGenerator` ni otro port hasta que un caso de uso real necesite esa capacidad.

## Agregar una Query pública

1. Definir parámetros y Response DTO mínimo.
2. Crear `{use-case}.query.ts` y `{use-case}.query-handler.ts` en la feature correspondiente.
3. Despachar mediante `QueryBus`.
4. Declarar un read port en Application si se requiere persistencia.
5. Implementarlo con TypeORM en Infrastructure y proyectar solo campos públicos.
6. No reconstruir Aggregates si un DTO basta.
7. Evitar N+1, aplicar filtros/orden/paginación solo si el contrato lo requiere.
8. Probar ausencia, visibilidad y comportamiento de lectura.

```text
React → NestJS Controller → QueryBus → QueryHandler → Read Port ← TypeORM → MySQL
```

Las consultas administrativas ordinarias se resuelven en el panel del CMS (Strapi); no requieren Queries artificiales en NestJS.

## Agregar un Command

1. Confirmar que existe una acción o efecto.
2. Crear `{use-case}.command.ts` y `{use-case}.command-handler.ts` con entrada mínima.
3. Validar entrada, existencia y precondiciones en Application.
4. Obtener estado mediante ports, nunca mediante TypeORM desde el Handler.
5. Crear/reconstruir Domain mediante APIs que preserven invariantes.
6. Invocar comportamiento de Domain.
7. Coordinar efectos externos mediante ports.
8. Devolver resultados seguros y probar el caso.

No incluir DataSource, repositories TypeORM, Persistence Models, el CMS o proveedores en un Command.

Para un CREATE o UPDATE administrativo gobernado por Application/Domain, el Handler devuelve error, aprobación o payload canónico. Puede leer estado, pero no ejecuta el `INSERT` o `UPDATE` final: en el flujo objetivo Strapi ejecuta la escritura final con ese payload. GET y DELETE los resolverá Strapi directo a MySQL mediante su futura infraestructura custom (NestJS no es un CRUD). El mecanismo concreto de la integración administrativa con Strapi se definirá en la fase de integración (ADR-027).

## Agregar un port

- Crear solo el contrato mínimo que un caso de uso necesita.
- Orientarlo a capacidad, no copiar la API de un proveedor.
- Evitar repositories genéricos.
- Implementarlo en Infrastructure y registrarlo con NestJS DI.
- Probar Application con un sustituto determinista y el adapter con integración real proporcional.
- Mantener el port con prefijo `I` en `Application/Ports`; no colocarlo en `Domain/Abstract`.

## Agregar un endpoint

1. Definir método, ruta, visibilidad, request, response y errores.
2. Crear controller/DTOs en Presentation.
3. Mapear a Command o Query y despachar con el bus correspondiente.
4. No colocar negocio o TypeORM en el controller.
5. Mapear resultados sin filtrar detalles internos.
6. Probar el contrato.
7. Registrar el endpoint real en `README.md` y `ENDPOINTS.md`.

Actualmente existen cero endpoints. No reservar rutas ni códigos HTTP antes de implementarlos.

## Persistencia y migrations (ADR-027)

> Las **TypeORM migrations** son la única autoridad estructural de las tablas de
> negocio. Están **registradas** en el DataSource y crean/evolucionan esas tablas;
> `synchronize` permanece `false`. Strapi comparte la base pero no crea, altera ni
> migra las tablas de negocio.

1. Diseñar un Persistence Model TypeORM separado del modelo Domain en
   `Infrastructure/Persistence/Models` del contexto propietario.
2. Definir mapping Domain ↔ Persistence.
3. Configurar claves, nulabilidad, unicidad, relaciones internas, checks
   compatibles, índices, cardinalidades y delete behaviors.
4. Generar una TypeORM Migration en `Infrastructure/Persistence/Migrations` del
   mismo contexto y registrarla en la configuración del módulo.
5. Revisar operaciones forward/revert y probar contra MySQL en un entorno seguro.
6. Versionar migration y documentación juntas.

Los Persistence Models también se usan para lectura/reconstrucción de estado en las
validaciones de negocio (por ejemplo `ICompanyProfileStateReader`).

Para CompanyProfile, mapear colecciones Domain sin IDs a filas técnicas: phone, email y social_link conservan UUID de Infrastructure cuando persiste el mismo valor lógico; location usa `company_profile_id` como PK/FK. WhatsApp se modela como SocialLink. El destinatario interno vive en `company_profile` y nunca se mezcla automáticamente con los emails públicos.

## CREATE/UPDATE administrativos y el CMS (Strapi)

Patrón objetivo de un CREATE o UPDATE administrativo de negocio (integración con
Strapi **pendiente**, ADR-025):

1. El Administrador edita en Strapi Admin.
2. Una integración/plugin custom de Strapi (futura) llama a un endpoint interno NestJS autenticado.
3. Request DTO → Command → `CommandBus` → Handler.
4. Lectura opcional mediante port/TypeORM.
5. Ejecución de Domain.
6. Error o payload canónico.
7. Escritura final única (mecanismo a definir con Strapi).
8. Prueba explícita de ausencia de doble escritura.

En esta fase **no** existe la integración visual/custom Strapi → NestJS, ni la
autenticación service-to-service, ni el re-registro de la frontera interna. NestJS
sigue siendo la autoridad de reglas de negocio; las TypeORM migrations gobiernan el
schema de las tablas de negocio; Strapi es el CMS administrativo (auth + sus tablas
internas) y accederá a los datos de negocio mediante infraestructura custom en una
fase posterior. No introducir un login propio en NestJS.

## Lógica de negocio de CompanyProfile (HU22–HU25) — conservada

La lógica de negocio de HU22–HU25 permanece **intacta** en NestJS tras retirar
Directus; solo dejó de estar registrada su frontera HTTP interna (pendiente de la
integración Strapi). Sirve de referencia del patrón anterior.

### HU22 — Agregar información de contacto

Cubre creaciones de `phone`, `email` y `social_link`, y el cambio del correo receptor por la misma familia de Strategies.

- Application: `Commands/AgregarInformacionDeContacto/` contiene únicamente el `Command` y el `Handler` orquestador. El `Command` solo transporta una entrada abierta; no declara enums, uniones de variantes ni resultados. El `Handler` no contiene `switch`/`if` por tipo ni importa `EmailAddress`: carga el Aggregate una vez y resuelve polimórficamente una Strategy compatible. Cada Strategy es propietaria de su identificador (`TIPO_TELEFONO`, `TIPO_CORREO`, `TIPO_CORREO_RECEPTOR`, `TIPO_RED_SOCIAL`) y del narrowing de sus `datos`. `IResultadoInformacionDeContacto` es la base común; `IResultadoInformacionDeContactoOrdenado` exige `companyProfileId` y `displayOrder` para las colecciones públicas, mientras `IResultadoCorreoReceptor` no admite esos campos. `AgregarCorreoStrategy` y `AgregarCorreoReceptorStrategy` comparten una sola `Validations/ValidadoraCorreo.ts`; esta construye `EmailAddress` y traduce `InvalidValueObjectException.reason` sin duplicar sus reglas. `ValidadoraTelefono` conserva la canonicalización E.164 con `libphonenumber-js`.
- Infrastructure: `Adapters/CompanyProfileStateReader.ts` reconstruye el Aggregate con TypeORM (solo `findOne`); no escribe.
- Presentation: `Controllers/CompanyProfileCmsController.ts`, sus DTOs y Mappers. La frontera interna (`/internal/cms/company-profile/*`) usa `AgregarInformacionDeContactoMapper` y `AgregarCorreoReceptorMapper`, ambos despachan `AgregarInformacionDeContactoCommand`. El controller **no está registrado** en `CompanyProfileModule` en esta fase.
- Seguridad: la protección service-to-service (antes `CmsInternalAuthGuard`, retirado con Directus) se rediseñará junto con la integración de Strapi.

Separación de validaciones: la validez intrínseca vive en los Value Objects, `ValidadoraCorreo` traduce los motivos de `EmailAddress` al rechazo Application compartido, la validación telefónica de plan vive en `ValidadoraTelefono`, y la unicidad de teléfono/correo/red permanece en el Aggregate `CompanyContactInformation`. WhatsApp es un `SocialLink`, nunca un teléfono. Los Value Objects reciben la entrada cruda (`unknown`) desde la frontera y rechazan `null`/`undefined`/no-string con mensajes específicos; sus límites de longitud coinciden con MySQL, de modo que un valor aprobado por Domain no falla luego por longitud:

- `EmailAddress`: obligatorio; no vacío; ≤254; un solo `@`; parte local ≤64 sin punto inicial/final ni puntos consecutivos; dominio con al menos dos etiquetas válidas (sin `-` inicial/final ni etiquetas vacías); sin espacios. Canonicalización: el dominio se normaliza a minúsculas y la parte local se preserva (puede ser sensible a mayúsculas); esa normalización también permite detectar duplicados por dominio. Sin allowlist de proveedores ni transformaciones de Gmail.
- `PhoneNumber` + `ValidadoraTelefono`: obligatorio; no vacío; plan de numeración real (`libphonenumber-js`); canónico E.164.
- `SocialLink` (red) + `ExternalUrl`: red obligatoria/no vacía/≤100; URL obligatoria/no vacía/≤2048/HTTP o HTTPS absoluta. No se validan extensiones multimedia: un `SocialLink` es un perfil/canal, no un archivo.
- `Address`: obligatoria; `trim`; no vacía; entre 10 y 500 caracteres. El mínimo es estructural y no exige palabras concretas ni existencia geográfica.
- `GeoCoordinates`: números finitos; latitud [-90, 90]; longitud [-180, 180], con mensajes distintos por caso.

Flujo de excepciones y mensajes: Domain lanza `InvalidValueObjectException`/`InvalidGeoCoordinatesException`; Application las traduce a `InformacionDeContactoRechazadaException`/`UbicacionRechazadaException` (para correo, exclusivamente mediante `ValidadoraCorreo`); el Controller las convierte en HTTP 422 y Presentation traduce `correo` a la columna de la frontera (`address` o `contact_request_recipient_email`). La integración del CMS deberá propagar mensajes seguros de 4xx y usar uno genérico ante errores técnicos.

Organización de `CompanyProfile.Application`: `Commands/` para casos de uso CQRS (Command + Handler); `Strategies/` para las implementaciones de Strategy de Application; `Ports/` para los contratos/interfaces que consume Application (`IEntradaInformacionDeContacto`, `IResultadoInformacionDeContacto`, `IAgregarInformacionDeContactoStrategy`, `ICompanyProfileStateReader`, `IValidadora`); `Validations/` para implementaciones concretas de validación; `Exceptions/` para excepciones propias; `Queries/` para lecturas CQRS. Las interfaces no se colocan junto a sus implementaciones ni en una carpeta `Interfaces`: van en `Ports`.

Patrón Strategy (para respetar OCP): `Handler → colección de Strategies → Strategy por tipo → Aggregate`. Las Strategies se inyectan como una colección mediante un token del caso de uso (`AGREGAR_INFORMACION_DE_CONTACTO_STRATEGIES`); cada una declara `soporta(entrada)` y `ejecutar(...)`. Si ninguna soporta la entrada se rechaza; si más de una la soporta se trata como error de configuración. Como la entrada es un contrato abierto, agregar un medio nuevo no modifica el `Handler` ni un enum/unión central: se crea la Strategy con su propio identificador de tipo y se registra en el composition root; si además el medio llega por una colección/forma nueva del CMS, se extiende la traducción de frontera del Mapper de Presentation. Strategy no es obligatorio para todo Command: aplica cuando existen variantes extensibles por tipo.

Precondición: `company_profile` (singleton) debe existir antes de agregar; HU22 no crea el perfil. Si no existe, el caso de uso rechaza la operación.

### HU24 — Agregar ubicación

Segundo caso de uso administrativo de CompanyProfile. Es un flujo único (no usa Strategy: no hay variantes por tipo) y solo cubre la **creación** de la ubicación.

- Application: `Commands/AgregarUbicacion/` (`AgregarUbicacionCommand` con `direccion`/`latitud`/`longitud` y el `Handler` orquestador), el resultado `Ports/IResultadoUbicacion.ts` y el rechazo de negocio `Exceptions/UbicacionRechazadaException.ts`. Reutiliza el puerto de solo lectura `ICompanyProfileStateReader` (no se crea un repositorio de ubicación).
- Domain: `Address` (`trim`, no vacío y longitud 10..500), `GeoCoordinates` (finitos, latitud [-90,90], longitud [-180,180]) y `CompanyLocation` (`Address` + `GeoCoordinates`). El Handler no duplica esas reglas; traduce `InvalidValueObjectException`/`InvalidGeoCoordinatesException` a `UbicacionRechazadaException`.
- Cardinalidad 0..1: el Handler rechaza si `informacion.location !== null` (no sobrescribe; modificar es HU25). `CompanyContactInformation.setLocation` se usa en memoria; NestJS no persiste.
- Presentation: `POST /internal/cms/company-profile/location` en `CompanyProfileCmsController` (no registrado en esta fase), sus DTOs y `Mappers/AgregarUbicacionMapper.ts` (traduce `address`/`latitude`/`longitude` ↔ `direccion`/`latitud`/`longitud`; el `company_profile_id` canónico procede del Aggregate, no del Administrador).

Persistencia: la tabla `location` ya existe (`company_profile_id` como PK/FK, `address`, `latitude`, `longitude`); HU24 no crea migration, no agrega `id` ni columnas de mapa y no genera UUID para la ubicación.

## Ejecutar el CMS (Strapi) localmente

Strapi es una aplicación Node independiente en `infrastructure/CMS/Strapi/` que
comparte la **misma** base MySQL/MariaDB del backend (`STRAPI_DB_*` apuntan a la
base `MYSQL_*`). Strapi gobierna solo sus tablas internas; las TypeORM migrations
gobiernan las tablas de negocio. La guía completa (variables y despliegue en
Hostinger) está en su propio
[`README.md`](../infrastructure/CMS/Strapi/README.md).

```powershell
cd infrastructure/CMS/Strapi
npm install
Copy-Item .env.example .env   # reemplace placeholders y configure STRAPI_DB_*
npm run develop               # crea el primer administrador en el primer arranque
```

`npm run build` compila el panel sin requerir base de datos; `npm run develop` y
`npm run start` requieren la base compartida configurada (en su primer arranque
Strapi crea/evoluciona solo el schema de sus tablas internas). No usar SQLite.

## PoC de Strapi

La adopción productiva de Strapi está condicionada a una PoC en el **Hostinger
Business Web Hosting existente** que documente evidencia de:

1. ejecución de Node.js 22 como aplicación Node administrada;
2. conexión a la base MySQL/MariaDB única compartida con el backend;
3. inicialización de las tablas internas de Strapi (bootstrap);
4. acceso y funcionamiento del panel de administración;
5. autenticación de administradores y roles/permisos;
6. `npm run build` y arranque (`npm run start`) en el entorno;
7. persistencia y comportamiento de uploads;
8. supervivencia de uploads y configuración tras reinicio/redeploy;
9. (fase posterior) integración administrativa custom Strapi → NestJS y su autenticación service-to-service.

No declarar Strapi adoptado antes de completar los criterios. Si falla, registrar una ADR para reconsiderar el CMS sin asumir alternativa.

## Formulario de contacto

Estado actual: existe `SubmitContactRequestDto` como tipo plano y Domain contiene `Client`, `ClientId`, `ContactRequest`, `TipoSolicitud` y `RequestedServiceReference`. No existen controller, endpoint, Command, Handler, ports, `ContactEmailDto` o adapter SMTP.

Flujo futuro:

1. React ofrece UX y envía `SubmitContactRequestDto` a Presentation.
2. Presentation/Application revalidan la entrada.
3. `SubmitContactRequestCommand` se despacha por `CommandBus`.
4. Contact.Application usa `IServicesReadPort` para validar Service.
5. Usa `ICompanyProfileReadPort` para obtener `ContactRequestRecipientEmail`.
6. Genera/proporciona el UUID en Application/composition, construye `ClientId`, crea `Client` con esa identidad efímera y después `ContactRequest`.
7. Mapea a `ContactEmailDto` y usa `IEmailSenderPort`.
8. Infrastructure implementa el port mediante un adapter SMTP/proveedor aún no seleccionado.
9. Expone resultados seguros y prueba abuso/fallos cuando se defina la política.

Los tres ports y `ContactEmailDto` se materializan solo junto con el caso de uso consumidor.

El CMS (Strapi) y MySQL no forman parte del flujo por defecto. No crear tablas para `Client` o `ContactRequest` sin finalidad y decisión. `From` es técnico, `To` procede de CompanyProfile y `Reply-To` del `EmailAddress` de `Client`.

## React/Vite — fase posterior

- No existe frontend en el árbol actual; implementarlo requiere una tarea posterior explícita.
- Cuando se implemente, crear `app`, `pages`, `features`, `components`, `hooks`, `services`, `types`, `utils` y `assets` por responsabilidades reales.
- React consume solo NestJS; nunca Strapi/MySQL.
- Definir tipos desde contratos HTTP, no compartir Domain.
- Cubrir accesibilidad y estados de carga, vacío, éxito y error.
- No elegir router, estado, UI kit o cliente HTTP sin requisito.

## Testing y entrega

- Domain: invariantes y comportamiento sin I/O ni frameworks.
- Application: Handlers, ports y precondiciones con fakes deterministas.
- Infrastructure: mappings y TypeORM/MySQL.
- Presentation: DTOs, validación y contratos HTTP.
- CMS (Strapi): criterios de PoC en Hostinger y, en fase posterior, la integración administrativa Strapi → NestJS.
- Frontend: comportamiento crítico y accesibilidad cuando exista tooling.

Antes de entregar, confirmar dirección de dependencias, ausencia de acceso a `internal/` ajeno, Domain libre de frameworks, DTOs explícitos, cero doble escritura, React aislado de Strapi/MySQL, ausencia de secretos y documentación coherente.

## Comandos verificados

Desde `backend/`:

```powershell
cd backend
npm ci
npm run typecheck
npm test
npm run build
```

Backend ofrece además `migration:show`, `migration:run` y `migration:revert`. El DataSource registra las tres migrations de negocio (autoridad estructural, ADR-027) y estos scripts las aplican contra MySQL. Usan `dist/src/Infrastructure/Persistence/TypeOrmDataSource.js` y las variables `MYSQL_*`; no se ejecutaron contra una base real en esta tarea.

Desde `infrastructure/CMS/Strapi/`:

```powershell
npm install
npm run build
npm run develop
```

`npm run build` no requiere base de datos. `npm run develop`/`npm run start` requieren la `.env` local (con `STRAPI_DB_*` apuntando a la base compartida); si el entorno no dispone de MySQL, deben reportarse como no verificados en lugar de inventar resultados.
