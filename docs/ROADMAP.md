# Roadmap

Este roadmap organiza el trabajo por fases sin asignar fechas. Una tarea solo se marca como completada después de existir y haber sido verificada en el repositorio.

## Fase 0 — Documentación y arquitectura

- [x] Crear documentación técnica inicial.
- [x] Registrar decisiones arquitectónicas iniciales.
- [x] Documentar límites entre módulos y capas.
- [x] Preparar catálogos para endpoints y decisiones futuras.
- [x] Alinear actores Cliente y Administrador con el ERS.
- [x] Documentar los tres flujos: consulta pública, consulta administrativa y mutación administrativa con Filter Hook.
- [x] Documentar el requisito y flujo conceptual del formulario público de contacto.
- [x] Documentar contenido estático, DTOs, validación, eventos y multimedia.
- [x] Precisar DDD pragmático, Bounded Contexts, dependencias hexagonales y arquitectura modular React.
- [x] Formalizar los Bounded Contexts iniciales `Portfolio`, `Services`, `CompanyProfile` y `Contact`.
- [x] Resolver framework, SDK, solución, namespace raíz y organización física inicial del backend.

## Fase 1 — Fundación técnica

- [x] Seleccionar .NET 10 (`net10.0`) y fijar el SDK 10.0.302.
- [x] Definir `backend/CromaticaCreativa.sln`, namespace `CromaticaCreativa.Modules` y proyectos separados por capa.
- [x] Crear los 16 proyectos estructurales de Domain, Application, Infrastructure y Presentation para los cuatro Bounded Contexts.
- [ ] Crear la base del backend ASP.NET Core.
- [ ] Configurar MediatR y Dependency Injection.
- [x] Aislar físicamente Domain/Application/Infrastructure/Presentation mediante proyectos separados y agregar referencias solo cuando el código real las requiere.
- [ ] Organizar Commands y Queries físicamente con una carpeta por caso de uso, mensaje, Handler y validación local solo cuando corresponda.
- [ ] Crear únicamente los Application Ports requeridos por casos de uso reales y registrar sus adaptadores de Infrastructure en el composition root.
- [ ] Definir la firma temporal definitiva de `IClock`, implementar el adaptador de reloj del sistema en Infrastructure y evitar acceso directo al tiempo desde el núcleo.
- [ ] Definir la estrategia de errores/resultados y su traducción segura entre Domain, Application, Infrastructure y Presentation.
- [ ] Crear la base de la aplicación React y TypeScript sin frameworks no aprobados.
- [ ] Definir la estructura React inicial de app, Pages, Features, Components, Hooks, Services y Types sin crear carpetas vacías.
- [ ] Establecer configuración segura y ejemplos de variables de entorno.
- [ ] Preparar configuración segura para el `From` técnico y credenciales de correo, sin fijar nombres antes de implementarlos.
- [ ] Definir estrategia local para PostgreSQL y la conexión de Directus al esquema existente.
- [ ] Incorporar checks de formato, compilación y calidad acordados.

## Fase 2 — Modelo de dominio y persistencia

- [x] Implementar `Portfolio` con Aggregate Roots `Project` y `CorporateClient` y Entity interna `ProjectMedia`.
- [x] Implementar `ProjectPeriod` con `EndDate >= StartDate` y `TotalDays` derivado.
- [x] Implementar `ProjectServiceReference` y `ProjectCategoryReference` mediante identidad mínima sin depender de `Services.Domain`.
- [x] Proteger la eliminación de un CorporateClient referenciado mediante FK `RESTRICT`; usar `Hidden` para retirarlo de publicación.
- [x] Implementar `Services` con Aggregate Roots `Service` y `ServiceCategory` y estados `Active`/`Inactive`.
- [x] Garantizar en Domain que ServiceCategory posea la identidad no vacía de exactamente un Service.
- [x] Modelar `ReferenceImage` mediante `MediaReference` como concepto diferenciado de `ProjectMedia`.
- [x] Implementar `CompanyProfile` con `CompanyContactInformation`, Entity `CompanyLocation` y Value Object `SocialLink`.
- [x] Implementar `ContactRequest` como Aggregate Root de `Contact` sin asumir persistencia histórica.
- [ ] Definir contratos mínimos en `Services/public/` para Portfolio y Contact.
- [ ] Definir el contrato mínimo en `CompanyProfile/public/` para obtener `ContactRequestRecipientEmail`.
- [ ] Decidir si las solicitudes requieren persistencia histórica antes de crear tabla o mapping de `ContactRequest`.
- [ ] Mantener misión, visión, descripción institucional, eslóganes y textos estáticos en código.
- [x] Implementar los Value Objects confirmados sin crear Shared Kernel por coincidencia de nombres.
- [x] Separar Persistence de Domain mediante modelos técnicos y mappers por Bounded Context persistido.
- [x] Definir ownership con `PortfolioDbContext`, `ServicesDbContext` y `CompanyProfileDbContext`, schemas e historiales de migrations propios; mantener Contact sin persistencia.
- [x] Configurar EF Core 10.0.10, Npgsql 10.0.3 y dotnet-ef local 10.0.10.
- [x] Crear las tres migrations iniciales, sus snapshots y revisar el SQL generado.
- [x] Configurar PK, FK internas, referencias UUID opacas entre contextos, nulabilidad, UNIQUE, CHECK, índices y comportamientos de eliminación.
- [ ] Aplicar las migrations iniciales sobre un PostgreSQL de desarrollo con credenciales configuradas y verificar el esquema real.
- [ ] Agregar tests de Domain e integración de persistencia.

## Fase 3 — API pública

- [ ] Definir contratos REST a partir de casos de uso reales.
- [ ] Definir el contrato del formulario y el catálogo final, acotado, de tipos de solicitud.
- [ ] Implementar Queries y Handlers de lectura necesarios para el Cliente.
- [ ] Exponer los servicios públicos necesarios para construir el selector del formulario.
- [ ] Exponer las ServiceCategories Active únicamente cuando su Service padre también esté Active.
- [ ] Implementar filtros de Portfolio por Service y ServiceCategory aplicando publicación de Projects.
- [ ] Definir si ProjectPeriod expone fechas, duración o ningún dato temporal.
- [ ] Implementar `SubmitContactRequestCommand`, validar el servicio mediante `Services/public/` y obtener el destinatario mediante `CompanyProfile/public/`.
- [ ] Definir el Application Port conceptual `IEmailSender` —o el nombre final aprobado— sin acoplar Application o Domain a un proveedor.
- [ ] Seleccionar el proveedor de correo e implementar su adaptador en Infrastructure.
- [ ] Traducir fallos del proveedor al contrato de Application sin exponer detalles técnicos ni convertirlos en Domain Exceptions.
- [ ] Implementar el endpoint público de contacto sin autenticación y registrar su ruta solo cuando exista.
- [ ] Implementar endpoints mediante Presentation y MediatR.
- [ ] Mapear Request DTOs y Response DTOs sin exponer Entities de Domain.
- [ ] Exponer exclusivamente campos públicos.
- [ ] Definir paginación, filtros y errores donde corresponda.
- [ ] Agregar tests de Application y contratos HTTP.
- [ ] Actualizar los catálogos de endpoints con cada implementación.

## Fase 4 — Integración con Directus

- [ ] Definir configuración self-hosted y acceso seguro.
- [ ] Definir en Directus el acceso y los permisos para uno o, como máximo, dos Administradores.
- [ ] Conectar Directus al PostgreSQL existente e introspeccionar las tablas creadas por EF Core Migrations.
- [ ] Restringir a usuarios editoriales la modificación del Data Model mediante roles, policies y permissions de mínimo privilegio.
- [ ] Implementar Filter Hooks bloqueantes para create, update y delete del dominio.
- [ ] Cubrir Project, ProjectMedia, CorporateClient, Service, ServiceCategory, CompanyContactInformation y CompanyLocation con los Filter Hooks requeridos.
- [ ] Implementar Commands y endpoints internos requeridos para procesar esas mutaciones.
- [ ] Decidir y configurar autenticación/autorización Directus → ASP.NET Core.
- [ ] Verificar rechazo de operaciones inválidas y cancelación en Directus.
- [ ] Verificar normalización o reemplazo del payload aprobado.
- [ ] Evitar y probar ausencia de doble escritura entre ASP.NET Core y Directus.
- [ ] Probar CRUD administrativo completo con persistencia final realizada por Directus.
- [ ] Definir tratamiento y almacenamiento de imágenes y videos.
- [ ] Procesar asociaciones multimedia mediante Filter Hooks/Commands y persistirlas con Directus.
- [ ] Verificar el flujo editorial completo y la visibilidad de publicación.

## Fase 5 — Frontend React

- [ ] Definir para el Cliente la navegación, páginas y sistema visual responsive sin autenticación.
- [ ] Implementar composición global en `app/` y Pages por rutas reales.
- [ ] Organizar comportamiento cohesivo en Features sin duplicar componentes reutilizables.
- [ ] Extraer Hooks solo para responsabilidades React reales.
- [ ] Centralizar el cliente HTTP hacia ASP.NET Core.
- [ ] Mantener Services/API clients independientes de Hooks y Components.
- [ ] Implementar misión, visión y textos institucionales estáticos en código.
- [ ] Implementar la página de Services con categorías activas y sus ReferenceImages.
- [ ] Implementar Portfolio con filtros Service/ServiceCategory y listado/detalle de Projects publicados.
- [ ] Implementar CompanyProfile con contacto público, redes sociales y ubicación configurados.
- [ ] Implementar el formulario público con nombre, apellido, correo, empresa, teléfono, tipo de solicitud, servicio y mensaje cuando corresponda.
- [ ] Integrar el selector con los servicios públicos de ASP.NET Core y enviar el formulario exclusivamente a esa API.
- [ ] Agregar validación UX y feedback de envío sin confiar en ella como única defensa.
- [ ] Integrar imágenes y videos optimizados.
- [ ] Cubrir estados de carga, error y contenido vacío.
- [ ] Verificar accesibilidad y experiencia responsive.

## Fase 6 — Testing y optimización

- [ ] Completar la estrategia de unit, integration, API y frontend tests.
- [ ] Probar validación de DTOs, invariantes de Domain y constraints de PostgreSQL.
- [ ] Verificar consultas administrativas directas y mutaciones bloqueadas por Filter Hooks.
- [ ] Probar que EF Core pueda leer estado sin persistir por segunda vez la mutación administrativa.
- [ ] Probar campos faltantes, correo inválido, tipo de solicitud inválido y servicio inexistente en el formulario.
- [ ] Probar envío exitoso, fallo temporal del proveedor y que no se revelen detalles internos.
- [ ] Probar Handlers dependientes del tiempo y del correo con sustitutos deterministas como `FakeClock` y `FakeEmailSender` cuando existan esos ports.
- [ ] Verificar que los tests de Domain no dependan de SMTP, base de datos, reloj del sistema, HTTP ni Directus.
- [ ] Evaluar e implementar protección proporcional contra abuso, rate limiting, spam, automatización y tamaño de payload; incorporar CAPTCHA solo si se justifica.
- [ ] Verificar un envío real a la dirección configurable de Cromática Creativa en un entorno seguro.
- [ ] Automatizar los checks acordados.
- [ ] Evaluar tests de arquitectura para impedir dependencias Domain → capas externas, Application → Infrastructure y accesos entre `internal/`.
- [ ] Probar la frontera frontend para evitar requests dispersos y accesos a Directus.
- [ ] Medir consultas y eliminar N+1 detectados.
- [ ] Validar proyecciones, paginación y uso de `AsNoTracking()`.
- [ ] Medir antes de incorporar caching.
- [ ] Optimizar entrega de imágenes y multimedia.
- [ ] Revisar seguridad, dependencias y exposición de datos.

## Fase 7 — Deployment

- [ ] Seleccionar plataforma y topología de deployment.
- [ ] Decidir si se utilizará Docker.
- [ ] Configurar secretos y variables por entorno.
- [ ] Configurar de forma segura el `From` técnico y las credenciales del proveedor; obtener el `To` desde CompanyProfile.
- [ ] Asegurar HTTPS y aislamiento de PostgreSQL.
- [ ] Definir backups y restauración de datos y multimedia.
- [ ] Configurar migrations seguras durante despliegues.
- [ ] Incorporar observabilidad y health checks según necesidad.
- [ ] Documentar operación, rollback y recuperación.

## Decisiones pendientes antes de implementar

- Versiones de React, PostgreSQL, Directus y dependencias externas distintas de EF Core/Npgsql.
- Composition root y host ASP.NET Core.
- Firma y tipo temporal definitivos del port de reloj, implementación concreta y lifetime de DI.
- Controllers o Minimal APIs.
- Límites transaccionales de futuros casos de uso.
- Efecto de desactivar Service/ServiceCategory sobre Projects históricos.
- Exposición pública de fechas o duración de `ProjectPeriod`.
- Estructura física final de React, routing, providers y herramientas frontend adicionales.
- Storage persistente de multimedia y política de URLs externas para videos.
- Permisos y operación de Directus.
- Autenticación y autorización Directus → ASP.NET Core.
- Cobertura exacta de Filter Hooks por colección y operación.
- Contrato definitivo del formulario y catálogo final de tipos de solicitud.
- Proveedor de correo, configuración técnica de `From`, asunto y plantillas. `To` proviene de CompanyProfile y `Reply-To` del solicitante.
- Política anti-spam/rate limiting, límites de tamaño, observabilidad y posible CAPTCHA.
- Persistencia histórica o no de solicitudes de contacto.
- Frameworks y alcance de testing.
- Estrategia global de errores/resultados y catálogo de mapping HTTP.
- Desarrollo local y deployment, incluido el posible uso de Docker.

El login o autenticación propia para personas, las cuentas de Cliente, los roles propios de ASP.NET Core y un panel administrativo en React no son decisiones pendientes: están fuera del alcance de la V1. La autenticación técnica Directus → ASP.NET Core sí permanece pendiente.
