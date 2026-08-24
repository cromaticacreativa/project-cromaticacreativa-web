# Desarrollo

Esta guía describe el desarrollo sobre la fundación Node.js/NestJS activa.

## Estado del entorno y transición

El backend posee `package.json` y `package-lock.json`. NestJS, `@nestjs/cqrs`, TypeORM/MySQL, Domain TypeScript y tests están configurados. Directus `12.3.0` está incorporado en `infrastructure/CMS/Directus/` como aplicación Node independiente, con la extensión estable `extensions/company-profile/`. HU22 "Agregar información de contacto" es el primer caso de uso Application real de CompanyProfile e incluye un endpoint interno (`/internal/cms/company-profile/contact-information`); no existen todavía endpoints públicos y, fuera de HU22, los demás casos de uso siguen pendientes. El frontend no está implementado.

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

Las consultas administrativas ordinarias serían directas mediante Data Studio si Directus supera la PoC; no requieren Queries artificiales.

## Agregar un Command

1. Confirmar que existe una acción o efecto.
2. Crear `{use-case}.command.ts` y `{use-case}.command-handler.ts` con entrada mínima.
3. Validar entrada, existencia y precondiciones en Application.
4. Obtener estado mediante ports, nunca mediante TypeORM desde el Handler.
5. Crear/reconstruir Domain mediante APIs que preserven invariantes.
6. Invocar comportamiento de Domain.
7. Coordinar efectos externos mediante ports.
8. Devolver resultados seguros y probar el caso.

No incluir DataSource, repositories TypeORM, Persistence Models, Directus o proveedores en un Command.

Para un CREATE o UPDATE administrativo gobernado por Application/Domain, el Handler devuelve error, aprobación o payload canónico. Puede leer estado, pero no ejecuta el `INSERT` o `UPDATE` final de la misma operación: Directus es el escritor final único. Los DELETE administrativos se ejecutan directamente en Directus y no requieren Command, Handler, Strategy, validación o endpoint backend mientras no exista una regla de negocio adicional. Si una eliminación adquiere una invariante en el futuro, se reevaluará esa operación concreta.

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

## Persistencia y migrations

1. Diseñar un Persistence Model TypeORM separado del modelo Domain en `Infrastructure/Persistence/Models` del contexto propietario.
2. Definir mapping Domain ↔ Persistence.
3. Configurar claves, nulabilidad, unicidad, relaciones internas, checks compatibles, índices, cardinalidades y delete behaviors.
4. Generar una TypeORM Migration en `Infrastructure/Persistence/Migrations` del mismo contexto.
5. Revisar operaciones forward/revert y pérdida potencial de datos.
6. Probar contra MySQL en un entorno seguro.
7. Verificar que Directus, si ya fue adoptado, introspeccione sin alterar el esquema.
8. Versionar migration y documentación juntas.

No usar `synchronize: true`. Mantener el único DataSource técnico global, migrations con ownership modular, variables documentadas, ausencia de FKs cruzadas y ausencia de tabla `ContactRequest`. No agregar migrations bajo una capa global `database`.

Para CompanyProfile, mapear colecciones Domain sin IDs a filas técnicas: phone, email y social_link conservan UUID de Infrastructure cuando persiste el mismo valor lógico; location usa `company_profile_id` como PK/FK. WhatsApp se modela como SocialLink. El destinatario interno vive en `company_profile` y nunca se mezcla automáticamente con los emails públicos.

## CREATE/UPDATE administrativos y Directus

Patrón general de un CREATE o UPDATE administrativo:

1. Filter Hook bloqueante antes de persistir.
2. Llamada autenticada a un endpoint interno NestJS.
3. Request DTO → Command → `CommandBus` → Handler.
4. Lectura opcional mediante port/TypeORM.
5. Ejecución de Domain.
6. Error o payload canónico.
7. Cancelación o continuación del Hook.
8. Escritura final única de Directus.
9. Prueba explícita de ausencia de doble escritura.

La autenticación Hook → NestJS usa el token técnico `Bearer` de ADR-023 (`CMS_INTERNAL_TOKEN`/`BACKEND_INTERNAL_TOKEN`); no elegir otro mecanismo sin una nueva ADR.

DELETE sigue un flujo distinto: confirmación y permisos administrativos en Directus → DELETE directo, sin Filter Hook ni NestJS. No crear endpoint, Command, Handler, Strategy o validación backend para eliminar mientras no exista una regla de negocio adicional. Si aparece una invariante futura, reevaluar solo esa eliminación.

## HU22 — Agregar información de contacto

Implementación real de referencia del patrón anterior. Cubre creaciones de `phone`, `email` y `social_link`, y el cambio del correo receptor por la misma familia de Strategies.

- Application: `Commands/AgregarInformacionDeContacto/` contiene únicamente el `Command` y el `Handler` orquestador. El `Command` solo transporta una entrada abierta; no declara enums, uniones de variantes ni resultados. El `Handler` no contiene `switch`/`if` por tipo ni importa `EmailAddress`: carga el Aggregate una vez y resuelve polimórficamente una Strategy compatible. Cada Strategy es propietaria de su identificador (`TIPO_TELEFONO`, `TIPO_CORREO`, `TIPO_CORREO_RECEPTOR`, `TIPO_RED_SOCIAL`) y del narrowing de sus `datos`. `IResultadoInformacionDeContacto` es la base común; `IResultadoInformacionDeContactoOrdenado` exige `companyProfileId` y `displayOrder` para las colecciones públicas, mientras `IResultadoCorreoReceptor` no admite esos campos. `AgregarCorreoStrategy` y `AgregarCorreoReceptorStrategy` comparten una sola `Validations/ValidadoraCorreo.ts`; esta construye `EmailAddress` y traduce `InvalidValueObjectException.reason` sin duplicar sus reglas. `ValidadoraTelefono` conserva la canonicalización E.164 con `libphonenumber-js`.
- Infrastructure: `Adapters/CompanyProfileStateReader.ts` reconstruye el Aggregate con TypeORM (solo `findOne`); no escribe.
- Presentation: `Controllers/CompanyProfileCmsController.ts`, sus DTOs y Mappers. `POST /internal/cms/company-profile/contact-information` usa `AgregarInformacionDeContactoMapper`; `POST /internal/cms/company-profile/contact-request-recipient-email` usa `AgregarCorreoReceptorMapper`, pero ambos despachan `AgregarInformacionDeContactoCommand`.
- Seguridad: `src/Infrastructure/Security/CmsInternalAuthGuard.ts` protege `/internal/cms/*`.
- Directus: `infrastructure/CMS/Directus/extensions/company-profile/` (Filter Hook estable de CompanyProfile, fail closed).

Separación de validaciones: la validez intrínseca vive en los Value Objects, `ValidadoraCorreo` traduce los motivos de `EmailAddress` al rechazo Application compartido, la validación telefónica de plan vive en `ValidadoraTelefono`, y la unicidad de teléfono/correo/red permanece en el Aggregate `CompanyContactInformation`. WhatsApp es un `SocialLink`, nunca un teléfono. Los Value Objects reciben la entrada cruda (`unknown`) desde la frontera y rechazan `null`/`undefined`/no-string con mensajes específicos; sus límites de longitud coinciden con MySQL, de modo que un valor aprobado por Domain no falla luego por longitud:

- `EmailAddress`: obligatorio; no vacío; ≤254; un solo `@`; parte local ≤64 sin punto inicial/final ni puntos consecutivos; dominio con al menos dos etiquetas válidas (sin `-` inicial/final ni etiquetas vacías); sin espacios. Canonicalización: el dominio se normaliza a minúsculas y la parte local se preserva (puede ser sensible a mayúsculas); esa normalización también permite detectar duplicados por dominio. Sin allowlist de proveedores ni transformaciones de Gmail.
- `PhoneNumber` + `ValidadoraTelefono`: obligatorio; no vacío; plan de numeración real (`libphonenumber-js`); canónico E.164.
- `SocialLink` (red) + `ExternalUrl`: red obligatoria/no vacía/≤100; URL obligatoria/no vacía/≤2048/HTTP o HTTPS absoluta. No se validan extensiones multimedia: un `SocialLink` es un perfil/canal, no un archivo.
- `Address`: obligatoria; `trim`; no vacía; entre 10 y 500 caracteres. El mínimo es estructural y no exige palabras concretas ni existencia geográfica.
- `GeoCoordinates`: números finitos; latitud [-90, 90]; longitud [-180, 180], con mensajes distintos por caso.

Flujo de excepciones y mensajes: Domain lanza `InvalidValueObjectException`/`InvalidGeoCoordinatesException`; Application las traduce a `InformacionDeContactoRechazadaException`/`UbicacionRechazadaException` (para correo, exclusivamente mediante `ValidadoraCorreo`); el Controller las convierte en HTTP 422 y Presentation traduce `correo` a la columna de la frontera (`address` o `contact_request_recipient_email`). El Filter Hook propaga mensajes seguros de 4xx y usa uno genérico ante errores técnicos.

Organización de `CompanyProfile.Application`: `Commands/` para casos de uso CQRS (Command + Handler); `Strategies/` para las implementaciones de Strategy de Application; `Ports/` para los contratos/interfaces que consume Application (`IEntradaInformacionDeContacto`, `IResultadoInformacionDeContacto`, `IAgregarInformacionDeContactoStrategy`, `ICompanyProfileStateReader`, `IValidadora`); `Validations/` para implementaciones concretas de validación; `Exceptions/` para excepciones propias; `Queries/` para lecturas CQRS. Las interfaces no se colocan junto a sus implementaciones ni en una carpeta `Interfaces`: van en `Ports`.

Patrón Strategy (para respetar OCP): `Handler → colección de Strategies → Strategy por tipo → Aggregate`. Las Strategies se inyectan como una colección mediante un token del caso de uso (`AGREGAR_INFORMACION_DE_CONTACTO_STRATEGIES`); cada una declara `soporta(entrada)` y `ejecutar(...)`. Si ninguna soporta la entrada se rechaza; si más de una la soporta se trata como error de configuración. Como la entrada es un contrato abierto, agregar un medio nuevo no modifica el `Handler` ni un enum/unión central: se crea la Strategy con su propio identificador de tipo y se registra en el composition root; si además el medio llega por una colección/forma nueva de Directus, se extiende la traducción de frontera del Mapper de Presentation. Strategy no es obligatorio para todo Command: aplica cuando existen variantes extensibles por tipo.

Precondición: `company_profile` (singleton) debe existir antes de agregar; HU22 no crea el perfil. Si no existe, el caso de uso rechaza la operación.

### Ejecutar HU22 localmente

1. Genere un token aleatorio y configúrelo en ambos lados: `CMS_INTERNAL_TOKEN` en `backend/.env` y el mismo valor en `BACKEND_INTERNAL_TOKEN` de `infrastructure/CMS/Directus/.env`, junto con `BACKEND_INTERNAL_URL` (p. ej. `http://localhost:3000`). Nunca versione el token.
2. Con MySQL y las migrations al día, inicie el backend (`npm run start`) y Directus (`npm run start`).
3. Asegure que exista la fila `company_profile`.
4. Cree un `phone`, `email` o `social_link` desde Data Studio; verifique que el valor persistido sea el canónico devuelto por NestJS.
5. Intente un teléfono inválido o duplicado y verifique que Directus cancele la creación y MySQL no cambie.
6. Si el entorno no ofrece MySQL/Directus reales, documente los pasos como verificación manual pendiente; no invente resultados.

## HU24 — Agregar ubicación

Segundo caso de uso administrativo de CompanyProfile. Es un flujo único (no usa Strategy: no hay variantes por tipo) y solo cubre la **creación** de la ubicación.

- Application: `Commands/AgregarUbicacion/` (`AgregarUbicacionCommand` con `direccion`/`latitud`/`longitud` y el `Handler` orquestador), el resultado `Ports/IResultadoUbicacion.ts` y el rechazo de negocio `Exceptions/UbicacionRechazadaException.ts`. Reutiliza el puerto de solo lectura `ICompanyProfileStateReader` (no se crea un repositorio de ubicación).
- Domain: `Address` (`trim`, no vacío y longitud 10..500), `GeoCoordinates` (finitos, latitud [-90,90], longitud [-180,180]) y `CompanyLocation` (`Address` + `GeoCoordinates`). El Handler no duplica esas reglas; traduce `InvalidValueObjectException`/`InvalidGeoCoordinatesException` a `UbicacionRechazadaException`.
- Cardinalidad 0..1: el Handler rechaza si `informacion.location !== null` (no sobrescribe; modificar es HU25). `CompanyContactInformation.setLocation` se usa en memoria; NestJS no persiste.
- Presentation: endpoint `POST /internal/cms/company-profile/location` en `CompanyProfileCmsController`, sus DTOs y `Mappers/AgregarUbicacionMapper.ts` (traduce `address`/`latitude`/`longitude` ↔ `direccion`/`latitud`/`longitud`; el `company_profile_id` canónico procede del Aggregate, no del Administrador).
- Directus: la misma extensión `extensions/company-profile/` añade `location.items.create` con ruta explícita; reutiliza `CmsInternalAuthGuard`, el token de ADR-023 y el diseño fail closed. No se almacena enlace de Google Maps; solo `address`/`latitude`/`longitude`.

Persistencia: la tabla `location` ya existe (`company_profile_id` como PK/FK, `address`, `latitude`, `longitude`); HU24 no crea migration, no agrega `id` ni columnas de mapa y no genera UUID para la ubicación.

### Ejecutar HU24 localmente

1. Con el token configurado (igual que HU22) y `company_profile` (singleton) existente pero **sin** fila en `location`, inicie backend y Directus.
2. Cree una `location` válida desde Data Studio; verifique que se persista el `address` canónico (trim) y las coordenadas devueltas por NestJS, con el `company_profile_id` del singleton.
3. Intente crear una segunda `location`: NestJS rechaza (422) y Directus cancela; MySQL conserva solo la primera.
4. Intente coordenadas fuera de rango, dirección vacía o una dirección trivial como `a`: Directus cancela y MySQL no cambia.
5. Si el entorno no ofrece MySQL/Directus reales, documente los pasos como verificación manual pendiente; no invente resultados.

## Ejecutar Directus localmente — HU09

Directus requiere Node.js `>=22`. NestJS y Directus son procesos independientes, pero deben apuntar a la misma base MySQL.

1. Prepare MySQL y una única base para Cromática Creativa.
2. Cree `backend/.env` desde `.env.example` de la raíz con `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER` y `MYSQL_PASSWORD` reales.
3. Desde `backend/`, instale y aplique las migrations TypeORM:

   ```powershell
   cd backend
   npm ci
   npm run migration:run
   ```

4. Verifique que existan `corporate_client`, `project`, `media`, `service`, `category`, `company_profile`, `phone`, `email`, `location`, `social_link` y `typeorm_migration`.
5. Cree `infrastructure/CMS/Directus/.env` desde su `.env.example`. Use `DB_CLIENT=mysql` y haga coincidir exactamente `DB_HOST/DB_PORT/DB_DATABASE` con `MYSQL_HOST/MYSQL_PORT/MYSQL_DATABASE`. Configure valores locales reales y no versionados para `DB_USER`, `DB_PASSWORD`, `SECRET`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
6. Instale, inicialice e inicie:

   ```powershell
   cd infrastructure/CMS/Directus
   npm ci
   npm run bootstrap
   npm run start
   ```

7. El script `bootstrap` ejecuta el comando oficial `directus bootstrap`: instala/migra exclusivamente las tablas internas y, en la primera inicialización, crea el Administrador con `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
8. Abra `http://localhost:8055/admin`, pruebe login válido y rechazo de contraseña/correo inválidos.
9. Confirme que el registro público continúe deshabilitado —es el valor predeterminado— y que no exista flujo público “Crear cuenta” o “Registrarse”.
10. Confirme que las diez tablas de negocio sean reconocidas por Directus sin recrearlas ni cambiar su estructura desde Data Model.

El reset por correo es nativo de Directus y utiliza `PUBLIC_URL`. Para envío real se requieren `EMAIL_TRANSPORT=smtp`, `EMAIL_FROM` y las variables `EMAIL_SMTP_*` con credenciales reales; mientras no existan, queda **PREPARADO / NO VERIFICADO**. Para desarrollo o emergencia puede usarse el comando oficial:

```powershell
npx directus users passwd --email <correo> --password <nueva-contraseña>
```

No se crean tablas `directus_*` con TypeORM ni se modifican tablas de negocio desde Directus.

## PoC de Directus

HU09 local no equivale a adopción productiva. La PoC posterior en el **Hostinger Business Web Hosting existente** debe documentar evidencia de:

1. Node.js 22;
2. conexión MySQL;
3. tablas internas de Directus;
4. Data Studio;
5. introspección de tablas externas;
6. Filter Hooks bloqueantes;
7. Hook → NestJS;
8. aprobación/rechazo;
9. payload canónico;
10. persistencia aprobada;
11. no doble escritura;
12. uploads;
13. extensions;
14. supervivencia tras reinicio/redeploy.

No declarar Directus adoptado antes de completar todos los criterios. Si falla, crear una ADR para reconsiderar el CMS sin asumir alternativa.

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

Directus y MySQL no forman parte del flujo por defecto. No crear tablas para `Client` o `ContactRequest` sin finalidad y decisión. `From` es técnico, `To` procede de CompanyProfile y `Reply-To` del `EmailAddress` de `Client`.

## React/Vite — fase posterior

- No existe frontend en el árbol actual; implementarlo requiere una tarea posterior explícita.
- Cuando se implemente, crear `app`, `pages`, `features`, `components`, `hooks`, `services`, `types`, `utils` y `assets` por responsabilidades reales.
- React consume solo NestJS; nunca Directus/MySQL.
- Definir tipos desde contratos HTTP, no compartir Domain.
- Cubrir accesibilidad y estados de carga, vacío, éxito y error.
- No elegir router, estado, UI kit o cliente HTTP sin requisito.

## Testing y entrega

- Domain: invariantes y comportamiento sin I/O ni frameworks.
- Application: Handlers, ports y precondiciones con fakes deterministas.
- Infrastructure: mappings y TypeORM/MySQL.
- Presentation: DTOs, validación y contratos HTTP.
- Directus: los 14 criterios de PoC, hooks y escritor único.
- Frontend: comportamiento crítico y accesibilidad cuando exista tooling.

Antes de entregar, confirmar dirección de dependencias, ausencia de acceso a `internal/` ajeno, Domain libre de frameworks, DTOs explícitos, cero doble escritura, React aislado de Directus/MySQL, ausencia de secretos y documentación coherente.

## Comandos verificados

Desde `backend/`:

```powershell
cd backend
npm ci
npm run typecheck
npm test
npm run build
```

Backend ofrece además `migration:show`, `migration:run` y `migration:revert`. Estos scripts compilan primero y usan `dist/src/Infrastructure/Persistence/TypeOrmDataSource.js`; requieren `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER` y `MYSQL_PASSWORD`. No se ejecutaron contra una base real en esta corrección.

Desde `infrastructure/CMS/Directus/`:

```powershell
npm ci
npm run bootstrap
npm run start
```

Bootstrap e inicio requieren la `.env` local y MySQL real; si el entorno no dispone de ellos, deben reportarse como no verificados en lugar de inventar resultados.
