# Guía para agentes

Este archivo contiene reglas obligatorias para agentes Codex y colaboradores automatizados que modifiquen este repositorio. Su alcance comprende todo el árbol del repositorio, salvo que un `AGENTS.md` más específico establezca reglas adicionales para una subcarpeta.

## Principios de trabajo

- Mantener los cambios dentro del alcance solicitado y preservar el trabajo existente.
- No realizar refactors masivos ajenos a la tarea.
- Preferir código simple y explícito antes que abstracciones prematuras.
- No agregar dependencias sin una necesidad clara, comprobada y documentada.
- No inventar requisitos, versiones, endpoints, comandos o infraestructura.
- Actualizar la documentación relacionada en el mismo cambio.
- No almacenar secretos, credenciales ni archivos `.env` sensibles en Git.

## Terminología y alcance del ERS

- Usar **Cliente** como único término para el actor público que consulta el sitio.
- Cliente no representa una cuenta o Entity autenticada: no tiene registro, login, perfil, roles ni permisos persistidos; consulta contenido público y puede enviar el formulario de contacto mediante React y ASP.NET Core.
- Usar **Administrador** para el personal autorizado de Cromática Creativa que gestiona contenido.
- El Administrador accede al CMS Directus mediante credenciales administrativas; no existe panel administrativo propio ni autenticación administrativa en ASP.NET Core en la V1.
- Distinguir al actor Cliente del contenido de Clientes Corporativos gestionado conceptualmente por el módulo `CorporateClients`.
- La V1 no incluye comercio electrónico, pagos, cuentas de Cliente, interacción entre Clientes, autenticación propia, roles propios de ASP.NET Core ni panel administrativo en React.
- Mantener misión, visión, descripción institucional, eslóganes y textos corporativos poco cambiantes en código; no crear `SiteSettings`, un módulo `Site` ni tablas para ellos sin una necesidad real.

## Arquitectura obligatoria

- Mantener un monorepo y un backend de monolito modular; no introducir microservicios.
- Aplicar DDD de forma pragmática: modelar lenguaje, límites e invariantes reales sin crear artefactos ceremoniales.
- Aplicar arquitectura hexagonal dentro de cada módulo.
- Domain es la capa más interna; Application depende de Domain; Presentation depende de Application; Infrastructure puede depender de Application y Domain para implementar ports y mappings.
- Prohibir dependencias `Domain → Application/Infrastructure/Presentation` y `Application → Infrastructure/Presentation`.
- Conservar límites explícitos entre módulos.
- Ningún módulo puede importar ni utilizar `internal/` de otro módulo.
- Toda comunicación entre módulos debe pasar por contratos mínimos y explícitos de `public/`.
- Evitar dependencias circulares; si aparecen, revisar primero los límites de dominio.
- Definir Bounded Contexts por límites semánticos, lenguaje y modelo de negocio, no por tablas, Entities o carpetas.
- Tratar los módulos actuales como candidatos a límites de contexto; no afirmar automáticamente que cada módulo es un Bounded Context independiente.
- No compartir Entities o Aggregate Roots entre módulos/Bounded Contexts.
- Recordar que `public/` describe visibilidad dentro del monolito y no exposición HTTP.
- Mantener `contracts/`, `dtos/` y `events/` bajo `public/`, y `domain/`, `application/`, `infrastructure/` y `presentation/` bajo `internal/`; los ports pertenecen a `internal/application/ports/`.
- Los módulos conceptuales actuales son `Projects`, `CorporateClients`, `Services`, `Contact` y `Location`; no crear automáticamente `Identity`, `Users`, `Site`, `SiteSettings` o `Media`.

## Reglas por capa

### Domain

- Contiene lógica, reglas e invariantes del dominio.
- Puede contener Entities, Aggregate Roots, Value Objects, Domain Events, Domain Exceptions y Domain Services justificados.
- Crear Domain Exceptions únicamente para violaciones reales de reglas de negocio, invariantes, estados inválidos de Aggregates, creación inválida de Value Objects u operaciones de negocio no permitidas. No crear una excepción por cada error ni representar allí timeouts, SMTP, EF Core, PostgreSQL, filesystem, storage, HTTP o proveedores externos.
- `DomainException`, `ProjectCannotBePublishedException` e `InvalidProjectStateException` son ejemplos conceptuales de nomenclatura, no tipos requeridos ni implementados.
- Debe permanecer independiente de Application, Infrastructure, Presentation, EF Core, ASP.NET Core, PostgreSQL, Directus, MediatR, HTTP y SDKs externos.
- Mantener en Domain las invariantes propias de Entities, Aggregates y Value Objects; Application no debe reimplementarlas.
- Los Value Objects pertenecen a Domain, son inmutables, válidos desde su creación y comparados por valor; no crear uno por cada primitivo.
- Los Aggregate Roots protegen invariantes y límites de consistencia; no crear uno automáticamente por tabla ni exponer setters que permitan saltarse su comportamiento.
- Usar Domain Services solo cuando una regla real no pertenezca naturalmente a una Entity o Value Object.
- Colocar en `domain/abstractions/` únicamente interfaces cuyo significado forme parte genuina del lenguaje y reglas de Domain; no usarlo como depósito general.

### Application

- Contiene los casos de uso organizados por feature.
- Depende de Domain y lo orquesta. Un Handler puede y debe invocar comportamiento de Entities, Aggregate Roots, Value Objects o Domain Services cuando corresponda.
- No implementar dentro de Handlers reglas que sean invariantes propias de Domain.
- Aplica CQRS separando lectura y escritura cuando ambas responsabilidades existan: Commands para intención de cambio y Queries para lectura.
- Utiliza MediatR para despachar Commands y Queries.
- Organizar cada caso de uso en su propia carpeta bajo `application/commands/{UseCase}/` o `application/queries/{UseCase}/`, con su mensaje y Handler. Mantener allí DTOs o validadores específicos solo si son cohesivos; no crear archivos masivos `Commands.cs`, `Queries.cs` o `Handlers.cs`.
- Un Command contiene únicamente datos de entrada del caso de uso; no transporta `DbContext`, implementaciones concretas, modelos de Infrastructure ni detalles de Directus, SMTP o proveedores.
- Una Query es de solo lectura: no envía correo, no escribe, no muta Aggregates ni ejecuta otros efectos observables. Usar read ports y proyecciones de Infrastructure sin cargar un Aggregate cuando no sea necesario.
- Puede declarar ports que Infrastructure implementa.
- Ubicar en `application/ports/` las abstracciones que Application necesita para tiempo, correo, storage, read stores, gateways y otros recursos externos. Nombres como `IClock`, `IEmailSender`, `IProjectReadStore` e `IMediaStorage` son ejemplos conceptuales hasta su implementación.
- Las validaciones de entrada, existencia de recursos, precondiciones y coherencia del caso de uso pertenecen a Application; no confundirlas con invariantes de Domain.
- Tratar los errores de entradas, recursos requeridos ausentes y precondiciones del caso de uso como errores de Application, no como Domain Exceptions.
- No depender de Infrastructure, Presentation, EF Core, `DbContext`, ASP.NET Core, Directus ni implementaciones concretas.
- Recibir dependencias técnicas mediante Dependency Injection. No instanciar con `new` un `DbContext`, `SmtpClient`, cliente de Directus, adaptador de correo, repositorio concreto u otra dependencia técnica.
- Application sí puede crear objetos de Domain cuando el constructor, factory o método de creación conserva sus invariantes.
- Cuando la hora actual afecte el comportamiento y deba ser testeable, obtenerla mediante un port de Application —conceptualmente `IClock`— en lugar de usar directamente `DateTime.Now` o `DateTime.UtcNow`. Application pasa el timestamp explícitamente a Domain; Domain no consulta el reloj del sistema. Mantener pendiente la firma exacta del port.
- No exigir Commands y Queries en todos los módulos ni crear CRUD artificial solo por simetría.
- Las lecturas públicas usan Queries; toda mutación de datos del dominio procedente de Directus debe pasar por un Command y un caso de uso de Application.
- El Command de una mutación iniciada en Directus autoriza, rechaza o devuelve un payload canónico; no ejecuta con EF Core la persistencia final de esa misma mutación.
- El envío del formulario público es una acción y debe modelarse como Command; una Query nunca puede enviar correo.
- Application puede declarar un port de salida orientado a la capacidad de correo, pero no depender de SMTP, SDKs ni proveedores concretos.

### Infrastructure

- Implementa adaptadores técnicos: EF Core, `DbContext`, persistencia, PostgreSQL, almacenamiento y ports de Application.
- Puede depender de Application y Domain solo para implementar sus contratos y mappings compatibles; Application y Domain nunca dependen de Infrastructure.
- No contiene reglas de negocio.
- Entity Framework Core controla el esquema mediante migrations versionadas.
- Todo cambio al modelo persistente debe incluir la migration correspondiente cuando la infraestructura exista.
- EF Core puede consultar estado actual durante una mutación administrativa, pero no debe ejecutar `Add`, `Update`, `Remove` o `SaveChanges` como segunda escritura de esa misma operación.
- No exigir Repository Pattern. Preferir ports específicos por capacidad y no crear repositorios genéricos por defecto.
- Implementar el adaptador técnico de correo detrás del port de Application; mantener fuera del núcleo el proveedor, credenciales, destinatario y demás configuración.
- Implementar de igual modo los adaptadores de reloj, filesystem, storage y APIs externas. Infrastructure captura o traduce sus fallos técnicos al contrato esperado por la capa interior; no filtra excepciones de proveedor hacia Domain.
- Registrar las implementaciones concretas en el composition root mediante Dependency Injection. Application depende del port, nunca de clases como `SystemClock` o `SmtpEmailSender`.

### Presentation

- Contiene los adaptadores HTTP, mapping y códigos de respuesta.
- Delega casos de uso a MediatR.
- Depende de Application como adaptador de entrada.
- No contiene lógica de negocio, no manipula Aggregates para evitar Application, no crea adaptadores de Infrastructure y no usa directamente EF Core, `DbContext` o PostgreSQL.
- Mapear resultados y errores aprobados a HTTP sin exponer stack traces, SQL, detalles SMTP, credenciales, configuración ni excepciones internas. La estrategia concreta de resultados/excepciones y códigos HTTP permanece pendiente hasta implementarse.

## Datos, Directus y Filter Hooks

- PostgreSQL es la base principal de los datos del dominio y es compartida técnicamente por ASP.NET Core/EF Core y Directus.
- EF Core es la autoridad exclusiva del mapping, schema y migrations del dominio.
- Directus puede leer directamente tablas del dominio para consultas administrativas.
- Directus ejecuta el `INSERT`, `UPDATE` o `DELETE` final de una mutación administrativa aprobada.
- Toda mutación administrativa debe ser interceptada antes de persistirse por un Filter Hook bloqueante que invoque ASP.NET Core.
- El Filter Hook debe esperar el resultado, cancelar la operación rechazada y permitir o reemplazar el payload de una operación aprobada.
- ASP.NET Core despacha a Application, que orquesta Domain y puede leer estado mediante un port implementado con EF Core; no persiste por segunda vez la misma mutación.
- Evitar estrictamente la doble escritura.
- Directus no puede crear, eliminar o modificar tablas, columnas, constraints, Foreign Keys o relaciones del dominio; se adapta al esquema creado por EF Core Migrations.
- Directus se usa exclusivamente como CMS/backoffice autenticado para uno o, como máximo, dos Administradores.
- No tratar Directus como reemplazo de la ASP.NET Core API.
- El Administrador accede al CMS Directus mediante credenciales administrativas para gestionar el contenido publicado en el sitio web.
- Usar roles, policies y permissions de Directus con mínimo privilegio; el usuario editorial no debe requerir permisos irrestrictos para modificar el Data Model.
- El uso conceptual de Filter Hooks bloqueantes está aprobado. Solo el mecanismo de autenticación Directus → ASP.NET Core permanece pendiente; no fijar API Keys, JWT, OAuth, mTLS, shared secrets u otras opciones sin decisión aprobada.

## Frontend y API

- Organizar React conceptualmente mediante `app/`, `pages/`, `features/`, `components/`, `hooks/`, `services/`, `types/`, `utils/` y `assets/`; crear carpetas solo cuando exista una responsabilidad real.
- No replicar artificialmente en React las capas `Domain/`, `Application/`, `Infrastructure/` y `Presentation/` del backend.
- `app/` contiene composición, routing, providers y configuración global, no lógica específica de Projects, Services o Contact.
- Las Pages representan pantallas/rutas y componen features y componentes; no contienen detalles directos de acceso HTTP.
- Las features agrupan comportamiento funcional relevante; no crear una feature por componente pequeño ni duplicar en ellas componentes globalmente reutilizables.
- Los componentes visuales reutilizables no conocen EF Core, PostgreSQL, Directus, URLs hardcodeadas ni Entities de .NET, y no ejecutan requests arbitrarios.
- Crear hooks solo para responsabilidades React reales —estado, ciclo de vida, composición o reutilización—. Los hooks pueden consumir services; los services no dependen de hooks.
- Centralizar la comunicación con ASP.NET Core en `services/` o API clients equivalentes. Mantener el flujo Page/Component → Feature/Hook → Service/API client → ASP.NET Core.
- Los tipos TypeScript modelan contratos HTTP o necesidades de UI; no son Entities de Domain ni clases compartidas automáticamente con .NET.
- React consume exclusivamente la API ASP.NET Core; nunca consume Directus directamente.
- El Cliente accede al contenido público por medio de React y no se autentica.
- El formulario público pasa siempre por ASP.NET Core; no enviar correo desde React ni colocar en el frontend credenciales, destinatarios internos o configuración del proveedor.
- Centralizar la comunicación HTTP del frontend.
- No acoplar componentes React a detalles internos del backend.
- No inventar endpoints. Al implementar o cambiar uno, actualizar `README.md` y `docs/ENDPOINTS.md`.
- La API debe exponer únicamente los campos públicos necesarios.
- No exponer Entities de Domain como DTOs HTTP; mapear Request DTO → Command/Query y Domain/proyección → Response DTO.

## Formulario público de contacto

- El módulo `Contact` gestiona la información pública de contacto y redes sociales, además del caso de uso mediante el cual el Cliente envía una solicitud a Cromática Creativa.
- El Cliente no se autentica para enviar el formulario; Directus y sus Filter Hooks no participan en este flujo.
- Validar nuevamente en Presentation/Application todos los datos recibidos, aunque React haya aplicado validaciones de UX.
- El servicio seleccionado debe existir y ser válido o estar disponible/publicado cuando ese concepto exista.
- `Contact` debe verificar capacidades de `Services` mediante un contrato mínimo de `Services/public/` o el mecanismo interno aprobado; nunca acceder a `Services/internal/` ni consultar arbitrariamente sus tablas.
- No duplicar en React o `Contact` una lista independiente de servicios cuando `Services` sea la fuente vigente.
- Usar un port/adaptador para el envío de correo y no acoplar Application o Domain a SMTP, SendGrid, Mailgun, Resend, Amazon SES, Microsoft Graph, Gmail u otro proveedor.
- No convertir automáticamente el Request DTO en una Entity ni crear una tabla o Entity persistente `ContactRequest` sin un requisito y una decisión explícitos.
- No inventar persistencia histórica de solicitudes; permanece como decisión funcional pendiente.
- La dirección receptora debe ser configuración de aplicación/infraestructura, no hardcode de Domain ni dato controlado por el Cliente.
- Nunca aceptar del Cliente destinatarios, encabezados, plantillas, credenciales o configuración interna arbitrarios.
- Antes de producción, evaluar y probar límites de tamaño, tratamiento seguro del contenido, rate limiting, spam, automatización abusiva y observabilidad. CAPTCHA es una opción pendiente, no una decisión obligatoria.

## Seguridad

- Cliente: sin autenticación, cuenta o permisos; puede consumir lecturas públicas y enviar el formulario de contacto, pero no puede modificar contenido administrado.
- Administrador: usa autenticación de Directus mediante credenciales individuales que no deben compartirse; Directus debe operar sobre HTTPS y limitarse a uno o dos usuarios autorizados.
- ASP.NET Core API: no implementa login, registro, roles, permisos ni panel administrativo en la V1.
- ASP.NET Core API debe exponer solo información pública necesaria, el caso de uso público de contacto y endpoints internos para procesar mutaciones de Filter Hooks, validar parámetros y ocultar información interna.
- Autenticar y autorizar Directus → ASP.NET Core antes de producción, sin asumir todavía el mecanismo.
- No exponer PostgreSQL directamente a Internet.
- El Cliente y los Administradores humanos no se conectan directamente a PostgreSQL; Directus realiza el acceso administrativo con sus credenciales técnicas.
- Usar HTTPS en producción y mínimo privilegio para credenciales.
- Mantener secretos únicamente en variables de entorno y fuera del código y de Git.
- No revelar stack traces, credenciales, configuración de correo o detalles sensibles del proveedor en respuestas del formulario.

## Persistencia y rendimiento

- Crear y versionar migrations cuando cambie el modelo persistente; no editar el esquema desde Directus.
- Configurar constraints apropiados en PostgreSQL mediante EF Core: claves, nulabilidad, unicidad, relaciones, checks, índices y comportamientos de eliminación.
- Optimizar consultas de lectura con proyecciones y `AsNoTracking()` cuando corresponda.
- Evitar N+1, propagar `CancellationToken` y usar APIs asíncronas cuando aplique.
- Paginar y usar caching solo cuando el caso y las métricas lo justifiquen.
- No realizar optimizaciones prematuras.

## Validación, eventos y multimedia

- Validar en el nivel correcto: React y Directus aportan UX; Presentation traduce y valida la frontera de transporte; Application valida entradas, existencia, precondiciones y coherencia del caso de uso; Domain protege invariantes; PostgreSQL garantiza integridad estructural.
- No duplicar reglas de dominio únicamente en Directus ni depender de sus validaciones como única protección.
- Usar Domain Events solo para hechos relevantes del dominio y no para cada operación CRUD.
- Usar Integration Events solo cuando exista una integración real.
- No introducir Event Sourcing ni message brokers sin una decisión y requisito explícitos.
- No almacenar archivos multimedia como BLOB o base64 en Entities de PostgreSQL; guardar referencias y someter su asociación con `Projects` al mismo flujo de Filter Hook y Domain antes de que Directus persista.
- Mantener inicialmente la multimedia dentro de `Projects` salvo que aparezca lógica suficiente para un módulo propio.

## Calidad y documentación

- Respetar `docs/ARCHITECTURE.md` como fuente de verdad de arquitectura y `docs/CONVENTIONS.md` para nombres y organización.
- Consultar `docs/DEVELOPMENT.md` antes de agregar una feature, módulo, entidad o migration.
- Mantener `README.md`, `docs/ENDPOINTS.md`, `docs/ROADMAP.md` y `docs/DECISIONS.md` coherentes con el estado real.
- Agregar tests proporcionales al riesgo cuando exista infraestructura de pruebas.
- Probar Handlers con sustitutos deterministas de sus ports —por ejemplo, `FakeClock` o `FakeEmailSender` cuando esos contratos existan—. Los tests de Domain no dependen de SMTP, base de datos, reloj del sistema, HTTP ni Directus.
- No marcar como implementado o completado aquello que no exista y no haya sido verificado.

## Decisiones todavía abiertas

No asumir sin validación: versiones del stack, nombres de `.csproj` o namespaces raíz, Controllers frente a Minimal APIs, framework de testing, storage multimedia, personalización de Directus, autenticación Directus → ASP.NET Core, persistencia interna del CMS, proveedor y estrategia técnica de correo, destinatario/configuración, política antiabuso, persistencia histórica de solicitudes, contenedores o plataforma de deployment. Registrar una decisión aprobada en `docs/DECISIONS.md` cuando corresponda.
