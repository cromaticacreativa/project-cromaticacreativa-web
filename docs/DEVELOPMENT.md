# Desarrollo

Esta guía describe el flujo esperado para evolucionar el repositorio sin inventar comandos o estructura física todavía inexistentes. Debe complementarse cuando se cree la solución ejecutable.

## Estado del entorno

Actualmente no hay proyectos de backend o frontend, paquetes, base de datos configurada ni comandos de ejecución. Por tanto, esta guía define criterios y pasos conceptuales; no incluye comandos de `dotnet`, gestores npm, EF Core o Directus hasta que hayan sido creados y verificados en el repositorio.

La terminología funcional es obligatoria: **Cliente** es el actor público sin cuenta o autenticación que consulta contenido y puede enviar el formulario de contacto mediante React; **Administrador** es el personal autorizado que se autentica exclusivamente en Directus. El módulo conceptual `CorporateClients` contiene información institucional de organizaciones clientes y no cuentas del actor Cliente.

Antes de cualquier cambio:

1. Leer `AGENTS.md` y la documentación relevante.
2. Inspeccionar la estructura y el estado de Git.
3. Confirmar el módulo propietario de la capacidad.
4. Revisar patrones existentes antes de crear uno nuevo.
5. Limitar el cambio al caso de uso solicitado.

## Flujo de desarrollo

1. Definir el comportamiento y criterios de aceptación.
2. Identificar el módulo y la capa responsables.
3. Modelar primero reglas e invariantes reales en Domain, si existen.
4. Crear o ajustar el caso de uso en Application.
5. Declarar ports mínimos cuando se necesite una capacidad externa.
6. Implementar adaptadores en Infrastructure.
7. Exponer el caso de uso mediante Presentation si requiere HTTP.
8. Agregar tests proporcionales al riesgo.
9. Verificar límites entre módulos, seguridad y rendimiento.
10. Actualizar README, endpoints, roadmap, convenciones o decisiones afectadas.

## Agregar una funcionalidad

- Escribir el resultado observable esperado, entradas, errores y exposición pública aplicable.
- Elegir el módulo por ownership del negocio, no por conveniencia técnica.
- Evitar crear un módulo o servicio transversal para una sola operación simple.
- Implementar una porción vertical: caso de uso, port/adaptador necesario, presentación y tests.
- Exponer contratos en `public/` solo si otro módulo realmente debe consumirlos.
- No exponer Entities ni modelos EF Core en contratos HTTP o entre módulos.

## Agregar una Query pública

1. Definir el DTO requerido por el consumidor y los parámetros mínimos de la Query.
2. Crear una carpeta por caso de uso dentro de `internal/application/queries/` según la estructura física vigente.
3. Definir una Query inmutable e implementar su Handler con MediatR.
4. Co-localizar DTOs o validadores exclusivos solo cuando sean cohesivos; no agregar la Query o el Handler a archivos masivos compartidos.
5. Declarar o reutilizar un read port de Application cuando sea necesario aislar persistencia.
6. Implementar el port en Infrastructure con proyección directa cuando sea apropiado.
7. No cargar un Aggregate si la lectura solo requiere una proyección.
8. Seleccionar únicamente los campos requeridos, usar `AsNoTracking()` y evitar N+1.
9. Propagar `CancellationToken` y cubrir filtros, ausencia, orden, paginación y visibilidad según el contrato.

Estructura conceptual:

```text
GetProjects/
├── GetProjectsQuery.cs
├── GetProjectsQueryHandler.cs
└── ProjectDto.cs
```

Una Query no debe modificar estado observable. No se deben anticipar Queries sin un consumidor o requisito real.

En la V1, ejemplos conceptuales razonables son `GetProjectsQuery`, `GetProjectBySlugQuery`, `GetServicesQuery`, `GetCorporateClientsQuery` y las consultas necesarias para contacto o ubicación. No se consideran implementados ni obligatorios hasta que exista el requisito correspondiente.

```text
React → ASP.NET Core → Query → Handler → Read Port ← Infrastructure / EF Core → PostgreSQL
```

Las consultas administrativas de Data Studio leen PostgreSQL directamente y no se implementan como Queries de ASP.NET Core salvo que exista otro caso de uso real.

## Agregar un Command

1. Confirmar que existe una intención de acción/cambio que pertenece a la ASP.NET Core API.
2. Crear una carpeta por caso de uso dentro de `internal/application/commands/` y definir el Command con sus entradas mínimas; no incluir `DbContext`, adaptadores, modelos de Infrastructure ni detalles de Directus, SMTP o proveedores.
3. Validar en Application los datos, existencia, precondiciones y coherencia propios del caso de uso.
4. Cargar información mediante ports de Application implementados por Infrastructure; no referenciar EF Core o `DbContext` desde el Handler.
5. Reconstruir o crear objetos de Domain mediante APIs que preserven sus invariantes.
6. Invocar comportamiento del Aggregate, Entity, Value Object o Domain Service correspondiente.
7. Coordinar efectos externos mediante ports sin construir adaptadores técnicos.
8. Definir errores y devolver un resultado o payload canónico sin filtrar detalles internos.
9. No implementar en el Handler reglas que pertenezcan a Domain ni manipular estado evitando la API del Aggregate.
10. Si el Command procesa una mutación administrativa de Directus, no llamar a `SaveChanges` para persistir esa misma mutación. Otros Commands ejecutan únicamente el efecto autorizado por su caso de uso.
11. Agregar tests de validaciones de Application, invariantes/comportamiento de Domain y fallos de coordinación.

Estructura conceptual:

```text
CreateSomething/
├── CreateSomethingCommand.cs
└── CreateSomethingCommandHandler.cs
```

Toda mutación administrativa debe llegar a un Command mediante un Filter Hook antes de que Directus persista. Ejemplos conceptuales son `CreateProjectCommand`, `UpdateProjectCommand`, `DeleteProjectCommand`, `CreateCorporateClientCommand` o `UpdateServiceCommand`. No crear Commands ajenos al ERS ni asumir que estos ejemplos ya están implementados.

## Agregar un Application Port

1. Confirmar que el caso de uso necesita una capacidad externa y que no es una regla del lenguaje de Domain.
2. Declarar en `internal/application/ports/` el contrato mínimo orientado a la capacidad; no copiar la API de un proveedor ni crear un Generic Repository.
3. Inyectar el port en el Handler que lo necesita. Application no referencia la implementación concreta.
4. Implementar el adaptador en Infrastructure, incluyendo la traducción de fallos técnicos al contrato esperado por Application.
5. Registrar port e implementación en el composition root mediante Dependency Injection.
6. Probar Application con un sustituto determinista y probar el adaptador con integración proporcional al riesgo.

`IClock`, `IEmailSender`, `IProjectReadStore` e `IMediaStorage` son ejemplos conceptuales; no deben crearse todos preventivamente ni se consideran contratos implementados.

## Incorporar la hora actual a un caso de uso

1. Confirmar que el instante actual afecta realmente el comportamiento o resultado y debe ser controlable en tests.
2. Declarar o reutilizar un port conceptual `IClock` en Application, sin fijar su firma antes de la implementación real.
3. Inyectarlo en el Handler; no llamar directamente a `DateTime.Now` o `DateTime.UtcNow` desde Application.
4. Obtener el timestamp en Application y pasarlo explícitamente al método de Domain que lo necesite.
5. Implementar el acceso al reloj del sistema en Infrastructure —conceptualmente `SystemClock`— y registrarlo mediante Dependency Injection.
6. Probar el Handler con un reloj fijo o controlable, por ejemplo `FakeClock`; los tests de Domain reciben valores temporales explícitos.

`IClock` pertenece por defecto a Application. Solo debe reconsiderarse una abstracción en Domain si una regla autónoma del dominio exige genuinamente esa capacidad.

## Agregar una mutación administrativa

1. Definir en Directus la operación create, update o delete sobre una colección existente.
2. Crear un Filter Hook bloqueante que se ejecute antes de la persistencia.
3. Llamar desde el Hook a un endpoint interno de ASP.NET Core.
4. Mapear el Request DTO y despachar un Command mediante MediatR.
5. Recuperar estado actual mediante un port implementado con EF Core cuando sea necesario.
6. Reconstruir el Aggregate y ejecutar Domain cuando corresponda.
7. Devolver un error o un payload canónico aprobado.
8. Hacer que el Filter Hook cancele la operación rechazada o devuelva el payload aprobado a Directus.
9. Permitir que Directus ejecute el único `INSERT`, `UPDATE` o `DELETE` final.
10. Probar que no exista doble escritura.

No usar `DbContext.Add`, `Update`, `Remove` o `SaveChangesAsync` como persistencia final dentro del Command que procesa esa misma mutación de Directus.

## Agregar un endpoint

1. Confirmar el contrato REST: método, ruta, parámetros, respuesta, errores y visibilidad.
2. Implementar el adaptador en Presentation usando el enfoque establecido —Controllers o Minimal APIs— cuando esa decisión exista.
3. Mapear el request a Command o Query.
4. Despacharlo mediante MediatR y propagar `CancellationToken`.
5. Mapear el resultado y errores a respuestas y códigos HTTP consistentes.
6. No incluir lógica de negocio ni consultas EF Core en el endpoint.
7. Agregar tests del contrato HTTP.
8. Actualizar en el mismo cambio las tablas de `README.md` y `docs/ENDPOINTS.md`.

No documentar ni reservar rutas antes de implementarlas.

En la V1, el Cliente consume endpoints públicos sin autenticación para lecturas y para el futuro envío del formulario; no puede modificar contenido administrado. Los Filter Hooks consumirán endpoints internos para procesar mutaciones administrativas, pero sus rutas aún no existen y no deben inventarse. No agregar login, registro, roles o permisos propios sin un nuevo requisito aprobado.

## Agregar o modificar DTOs

1. Definir el Request DTO en la frontera HTTP con solo los campos admitidos.
2. Validar formato y consistencia de la solicitud antes de despachar el caso de uso.
3. Mapear Request DTO a Command o Query; no usar una Entity de Domain como request.
4. Ejecutar el Handler y aplicar invariantes dentro de Domain.
5. Proyectar Domain o persistencia a un Response DTO apropiado.
6. No devolver Entities, tipos EF Core o detalles internos mediante HTTP.
7. Colocar en `public/` únicamente DTOs o contratos que otro módulo necesite consumir.

```text
Request DTO → Command / Query → Handler → Domain
Domain / Projection → Response DTO → HTTP
```

## Agregar o modificar el formulario de contacto

El formulario pertenece conceptualmente a `Contact` y se implementará como un caso de uso público sin autenticación. Directus no interviene y el requisito actual no autoriza persistir cada solicitud.

1. Confirmar campos, obligatoriedad, longitudes, formatos, catálogo de tipos de solicitud y resultados esperados.
2. Mantener React limitado a UX, accesibilidad, selector de servicios y envío HTTP a ASP.NET Core; no enviar correo desde el navegador.
3. Definir un Request DTO de transporte sin reutilizarlo como Entity o modelo de Domain.
4. Crear un Command de Application, con nombre definitivo decidido al implementar, y despacharlo mediante MediatR.
5. Validar nuevamente los datos y la consistencia de la solicitud en Presentation/Application.
6. Validar el identificador del servicio mediante un contrato mínimo de `Services/public/` o el mecanismo entre módulos aprobado; no acceder a `Services/internal/`, su `DbContext` o sus tablas.
7. Aplicar en Domain únicamente reglas reales y Value Objects justificados.
8. Invocar un port de salida para la capacidad de correo, declarado hacia el núcleo.
9. Implementar en Infrastructure el adaptador del proveedor que se seleccione posteriormente; no acoplar Application o Domain a su SDK.
10. Mapear éxito y errores de forma segura sin revelar stack traces, credenciales, configuración o detalles internos del proveedor.
11. Agregar tests de Application, adaptador, contrato HTTP y frontend proporcionales al riesgo, incluida protección antiabuso cuando exista.
12. Actualizar README, arquitectura, endpoints y roadmap con el estado real.

El correo debe presentar de forma estructurada nombre, apellido, correo del Cliente, empresa, teléfono, tipo de solicitud, servicio y mensaje cuando corresponda. La dirección del Cliente permite responderle, pero no se asume que se use técnicamente como `From`. Destinatario, proveedor, credenciales, `From`, `Reply-To`, asunto y plantillas son configuración o decisiones pendientes y nunca parámetros libres del Cliente.

No crear una Entity o tabla `ContactRequest` por defecto. Si se solicita historial, primero definir identidad, ciclo de vida, finalidad, retención y ownership, y registrar la decisión correspondiente antes de agregar mapping o migration.

## Crear un Value Object

1. Confirmar que representa un concepto del dominio definido por sus valores y que protege una regla, comportamiento o significado real.
2. Especificar sus invariantes y distinguirlas de validaciones contextuales de Application.
3. Diseñarlo inmutable y con igualdad por valor.
4. Impedir su creación en estado inválido mediante constructor, factory o resultado explícito coherente con los patrones adoptados.
5. Mantenerlo independiente de EF Core, ASP.NET Core y otros detalles técnicos.
6. Probar igualdad, invariantes, casos válidos e inválidos.

No crear un Value Object para envolver cada `string` o primitivo. Ejemplos como `ProjectSlug`, `EmailAddress` y `PhoneNumber` solo aplican si sus reglas reales lo justifican.

## Crear un Aggregate

1. Determinar el límite de consistencia y las operaciones que deben protegerse juntas.
2. Identificar la Entity que actúa como Aggregate Root; no asumir un Root por tabla.
3. Definir invariantes y comportamiento explícito dentro de Domain.
4. Evitar setters externos y colecciones mutables que permitan saltarse el Root.
5. Diseñar creación y cambios mediante constructores seguros, factories o métodos de comportamiento.
6. Hacer que Application cargue el Aggregate mediante un port e invoque su API, sin reproducir sus reglas.
7. Probar invariantes, transiciones y límites del Aggregate.

## Agregar una entidad

1. Confirmar que representa identidad y ciclo de vida dentro del dominio.
2. Ubicarla en el módulo propietario y definir sus invariantes en Domain.
3. Evitar setters públicos que permitan estados inválidos, de acuerdo con los patrones que se adopten.
4. Mantenerla libre de dependencias de EF Core y ASP.NET Core.
5. Crear su configuración de mapping en Infrastructure.
6. Evaluar índices, constraints, relaciones, concurrencia y publicación.
7. Generar una migration si cambia el modelo persistente.
8. Probar reglas de dominio y mapping relevante.

No convertir automáticamente cada tabla o DTO en una Entity de dominio.

## Validación e integridad de datos

- **React:** validaciones de UX para campos requeridos, formatos visuales, longitudes, selector y feedback; nunca constituyen la única defensa.
- **Directus:** feedback inmediato al Administrador, campos requeridos, formatos, mensajes amigables y confirmaciones antes de eliminar. Estas comprobaciones son de UX, no la única defensa.
- **Filter Hook:** bloquear antes de persistir, autenticar la llamada interna, esperar la respuesta y cancelar o reemplazar el payload.
- **Presentation / Application:** validar Request DTOs, parámetros, formatos, precondiciones, existencia de recursos y consistencia del caso de uso; devolver errores HTTP apropiados.
- **Domain:** proteger invariantes y reglas reales aunque el caso de uso sea invocado desde otro adaptador.
- **Infrastructure / PostgreSQL:** configurar integridad estructural con `PRIMARY KEY`, `NOT NULL`, `UNIQUE`, `FOREIGN KEY`, `CHECK`, índices y comportamientos explícitos de `DELETE` cuando correspondan.
- **Infrastructure / correo:** encapsular entrega y fallos técnicos del proveedor sin ejecutar reglas de negocio ni filtrar detalles sensibles.

EF Core Configuration define las restricciones y EF Core Migrations las versiona. No duplicar reglas de dominio exclusivamente en Directus ni depender solo del frontend o CMS.

La misma separación aplica al tratamiento de errores:

- Domain representa exclusivamente violaciones de invariantes, estados inválidos del modelo, Value Objects inválidos u operaciones de negocio no permitidas.
- Application representa entradas inválidas del caso de uso, recursos requeridos ausentes y precondiciones de aplicación.
- Infrastructure captura o traduce fallos de SMTP, filesystem, storage, EF Core, PostgreSQL y APIs externas.
- Presentation publica únicamente resultados seguros y nunca stack traces, SQL, detalles SMTP, credenciales, configuración o excepciones internas.

No se ha seleccionado una librería de validación ni una estrategia global de excepciones/resultados; no asumirlas al crear la fundación técnica.

## Crear una migration

Los comandos concretos se documentarán cuando existan solución, proyectos y herramientas configurados.

El flujo obligatorio será:

1. Modificar el modelo y la configuración EF Core.
2. Generar una migration con un nombre descriptivo según `CONVENTIONS.md`.
3. Revisar íntegramente operaciones `Up` y `Down`, tipos, nulabilidad, defaults, índices y pérdida potencial de datos.
4. Verificarla sobre una base local compatible.
5. Aplicar y verificar la migration sobre PostgreSQL.
6. Hacer que Directus adapte o introspeccione la nueva estructura.
7. Confirmar que Data Studio y los Filter Hooks siguen funcionando.
8. Versionar la migration junto con el cambio de modelo.
9. Actualizar documentación si afecta contratos u operación.

Directus accede a los datos, pero no diseña el esquema. No crear o eliminar tablas/columnas del dominio, cambiar tipos, eliminar constraints, cambiar Foreign Keys o modificar relaciones estructurales fuera de una EF Core Migration. No ejecutar cambios manuales no versionados.

## Agregar un módulo

1. Documentar la capacidad, lenguaje y modelo de negocio, y por qué no pertenecen a un módulo existente.
2. Evaluar si existe un Bounded Context distinto por diferencias semánticas reales; no inferirlo de una tabla, Entity o carpeta.
3. Definir ownership de datos, invariantes y límites transaccionales.
4. Identificar contratos necesarios con otros módulos y comprobar que no compartan Entities/Aggregates ni generen ciclos.
5. Registrar una decisión arquitectónica si el cambio es significativo.
6. Crear `public/` mínimo e `internal/` con las capas requeridas; no llenar carpetas con abstracciones vacías.
7. Integrarlo en el composition root sin exponer detalles internos.
8. Agregar tests de arquitectura o dependencias si existe soporte.
9. Actualizar `README.md`, `ARCHITECTURE.md`, `ROADMAP.md` y diagramas.

Los módulos conceptuales actuales son `Projects`, `CorporateClients`, `Services`, `Contact` y `Location`. No crear automáticamente `Identity`, `Users`, `Site`, `SiteSettings` o `Media`. La multimedia permanece inicialmente en `Projects`; misión, visión, descripción institucional, eslóganes y textos poco cambiantes permanecen en código.

## Crear o modificar una feature React

1. Identificar una responsabilidad funcional cohesiva; no crear una feature por cada componente pequeño.
2. Crear o ajustar una Page si la capacidad representa una pantalla/ruta completa.
3. Ubicar componentes específicos dentro de la feature y reutilizar componentes globales cuando su alcance sea realmente transversal.
4. Extraer un hook solo cuando exista estado, ciclo de vida, composición o comportamiento React reutilizable.
5. Centralizar el acceso HTTP en `services/` o API clients equivalentes; no dispersar `fetch(...)` en Pages o componentes.
6. Definir tipos TypeScript a partir del contrato HTTP y necesidades de UI, sin compartir Entities de .NET.
7. Mantener el flujo Page/Component → Feature/Hook → Service/API client → ASP.NET Core.
8. No llamar Directus o PostgreSQL, no hardcodear URLs/credenciales y no replicar las cuatro capas hexagonales del backend.
9. Cubrir estados de carga, vacío, éxito, error y accesibilidad según la feature.

Para contacto, la Page compone la feature, el hook de formulario es opcional y solo se justifica por comportamiento React, y el service envía a ASP.NET Core. Nunca se envía correo desde el navegador.

## Agregar multimedia a un proyecto

1. Separar el archivo físico de la referencia del dominio.
2. No almacenar el archivo como BLOB o base64 en una Entity de PostgreSQL.
3. Permitir que el adaptador aprobado realice el upload a storage persistente y obtenga un identificador.
4. Interceptar la asociación mediante un Filter Hook y enviar la referencia a ASP.NET Core.
5. Despachar un Command que valide o normalice la asociación con `Project` o `ProjectMedia`.
6. Permitir que Directus persista únicamente la metadata y referencias aprobadas.

La tecnología concreta de storage y el uso de URLs externas para videos grandes están pendientes.

## Agregar eventos

- Crear un Domain Event solo para un hecho relevante del negocio, como el ejemplo conceptual `ProjectPublishedDomainEvent`.
- Mantener Domain Events dentro del monolito y despacharlos mediante MediatR u otro mecanismo interno apropiado cuando exista una razón.
- Crear un Integration Event solo cuando otro módulo o sistema tenga una necesidad real de consumirlo.
- No generar eventos para cada CRUD, no confundir CQRS con Event Sourcing y no agregar Kafka, RabbitMQ, Service Bus u otro broker sin requisito.

## Actualizar documentación

| Cambio | Documentos mínimos a revisar |
| --- | --- |
| Endpoint agregado o modificado | `README.md`, `ENDPOINTS.md` |
| Decisión arquitectónica | `DECISIONS.md`, `ARCHITECTURE.md` |
| Nueva dependencia o tecnología | `README.md`, `DECISIONS.md` si es relevante |
| Nuevo módulo o cambio de límite | `ARCHITECTURE.md`, `README.md`, `CONVENTIONS.md` |
| Formulario o integración de correo | `README.md`, `ARCHITECTURE.md`, `ENDPOINTS.md`, `ROADMAP.md` |
| Comando de desarrollo verificado | `README.md`, este documento |
| Funcionalidad o fase completada | `ROADMAP.md` |
| Nueva variable de entorno | `README.md`, archivo de ejemplo seguro cuando exista |

La documentación debe describir el estado real, no la intención como si estuviera implementada.

## Principios de testing

- Domain: unit tests rápidos para invariantes, Value Objects y comportamiento de Aggregate Roots.
- Application: tests de Handlers, coordinación, resultados y errores.
- Application Ports: sustituir reloj, correo y otras capacidades con fakes deterministas —por ejemplo, `FakeClock` y `FakeEmailSender` cuando existan los contratos—.
- Infrastructure: integration tests de mappings, consultas, constraints y PostgreSQL.
- Presentation: tests de rutas, serialización, validación y códigos HTTP.
- Directus/Filter Hooks: tests de bloqueo, aprobación, rechazo, transformación de payload y ausencia de doble escritura.
- Frontend: tests del comportamiento crítico y de accesibilidad cuando se establezca la herramienta.
- Contacto: email inválido, campos faltantes, tipo de solicitud inválido, servicio inexistente, envío correcto, fallo del proveedor y rate limit cuando esté implementado.
- Arquitectura: tests de dependencias si resultan mantenibles y aportan protección real.

Los tests deben ser deterministas, legibles y centrados en comportamiento. No fijar un porcentaje de cobertura sin una política aprobada. No sustituir integración real con mocks en áreas donde el riesgo reside en el mapping o la base de datos.

Los tests de Domain reciben timestamps y datos explícitos; no dependen de SMTP, base de datos, reloj del sistema, HTTP ni Directus.

## Revisión antes de entregar

- El cambio compila, se ejecuta y pasa los checks que existan.
- Los comandos documentados fueron realmente verificados.
- Ningún módulo consume `internal/` de otro.
- Domain continúa libre de dependencias técnicas.
- Application depende de Domain, invoca su comportamiento cuando corresponde y no reimplementa sus invariantes.
- Application no depende de Infrastructure ni crea dependencias técnicas con `new`; los adaptadores se inyectan mediante ports.
- Commands y Queries están organizados por caso de uso; las Queries no producen efectos y los Commands solo transportan sus entradas.
- El tiempo controlable llega a Application mediante un port y se pasa explícitamente a Domain; no se consulta el reloj del sistema desde el núcleo.
- Domain Exceptions representan únicamente errores de negocio; los fallos técnicos se encapsulan en Infrastructure y Presentation no revela detalles internos.
- Presentation delega y no contiene negocio.
- El Cliente sigue sin autenticación; puede consultar contenido y enviar el formulario, pero no modificar contenido administrado. El Administrador utiliza Directus.
- Directus consulta PostgreSQL directamente y persiste solo mutaciones aprobadas por Filter Hooks y ASP.NET Core.
- ASP.NET Core puede leer estado con EF Core, pero no duplica la escritura final de Directus.
- ASP.NET Core no incorpora login de Cliente, registro, Identity, roles propios o panel administrativo sin requisito aprobado.
- El formulario no pasa por Directus, no se envía desde React y no se persiste automáticamente.
- `Contact` consume solo el límite público aprobado de `Services`; ni Application ni Domain dependen del proveedor de correo.
- React usa Pages/Features/Components/Hooks/Services según responsabilidades reales, centraliza HTTP y no replica las capas del backend.
- Request y Response DTOs no exponen Entities de Domain.
- Las validaciones e integridad están cubiertas en las capas apropiadas.
- No se añadieron secretos ni artefactos locales.
- Las migrations y contratos están revisados si aplican.
- Endpoints y documentación reflejan el estado real.

Hasta que exista tooling ejecutable, la verificación se limita a consistencia documental y revisión de enlaces/estructura.
