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
- [ ] Resolver decisiones abiertas necesarias para la fundación técnica.
- [ ] Validar con el equipo los módulos conceptuales iniciales.

## Fase 1 — Fundación técnica

- [ ] Seleccionar versiones soportadas del stack.
- [ ] Definir estructura física de la solución .NET y namespaces.
- [ ] Crear la base del backend ASP.NET Core.
- [ ] Configurar MediatR y Dependency Injection.
- [ ] Establecer físicamente las reglas de dependencia Domain/Application/Infrastructure/Presentation.
- [ ] Organizar Commands y Queries físicamente con una carpeta por caso de uso, mensaje, Handler y validación local solo cuando corresponda.
- [ ] Crear únicamente los Application Ports requeridos por casos de uso reales y registrar sus adaptadores de Infrastructure en el composition root.
- [ ] Definir la firma temporal definitiva de `IClock`, implementar el adaptador de reloj del sistema en Infrastructure y evitar acceso directo al tiempo desde el núcleo.
- [ ] Definir la estrategia de errores/resultados y su traducción segura entre Domain, Application, Infrastructure y Presentation.
- [ ] Crear la base de la aplicación React y TypeScript sin frameworks no aprobados.
- [ ] Definir la estructura React inicial de app, Pages, Features, Components, Hooks, Services y Types sin crear carpetas vacías.
- [ ] Establecer configuración segura y ejemplos de variables de entorno.
- [ ] Preparar configuración segura para dirección receptora y credenciales de correo, sin fijar nombres antes de implementarlos.
- [ ] Definir estrategia local para PostgreSQL y la conexión de Directus al esquema existente.
- [ ] Incorporar checks de formato, compilación y calidad acordados.

## Fase 2 — Modelo de dominio y persistencia

- [ ] Validar límites y responsabilidades de Projects, CorporateClients, Services, Contact y Location.
- [ ] Validar qué módulos se alinean realmente con Bounded Contexts y documentar su lenguaje ubicuo.
- [ ] Confirmar que Contact cubre información pública y envío de solicitudes sin introducir un módulo adicional innecesario.
- [ ] Definir el contrato mínimo mediante el cual Contact valida servicios a través de `Services/public/`.
- [ ] Decidir si las solicitudes requieren persistencia histórica; no crear `ContactRequest` mientras no exista ese requisito.
- [ ] Mantener multimedia en Projects y reevaluar un módulo propio solo si aparece lógica suficiente.
- [ ] Mantener misión, visión, descripción institucional, eslóganes y textos estáticos en código.
- [ ] Diseñar el modelo de dominio inicial y sus invariantes.
- [ ] Diseñar Aggregates y límites de consistencia a partir de reglas reales, no de tablas.
- [ ] Identificar Value Objects y Domain Services únicamente donde protejan conceptos o reglas reales.
- [ ] Definir ownership de datos y estrategia de `DbContext`.
- [ ] Configurar EF Core y PostgreSQL.
- [ ] Crear y revisar las primeras migrations.
- [ ] Configurar constraints, índices y comportamientos de eliminación apropiados.
- [ ] Agregar tests de Domain e integración de persistencia.

## Fase 3 — API pública

- [ ] Definir contratos REST a partir de casos de uso reales.
- [ ] Definir el contrato del formulario y el catálogo final, acotado, de tipos de solicitud.
- [ ] Implementar Queries y Handlers de lectura necesarios para el Cliente.
- [ ] Exponer los servicios públicos necesarios para construir el selector del formulario.
- [ ] Implementar el Command de contacto y validar el servicio seleccionado mediante el límite público de Services.
- [ ] Definir un port de salida para correo sin acoplar Application o Domain a un proveedor.
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
- [ ] Implementar servicios, Clientes Corporativos, contacto, ubicación y listado/detalle de proyectos.
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
- [ ] Configurar de forma segura el destinatario y las credenciales del proveedor de correo.
- [ ] Asegurar HTTPS y aislamiento de PostgreSQL.
- [ ] Definir backups y restauración de datos y multimedia.
- [ ] Configurar migrations seguras durante despliegues.
- [ ] Incorporar observabilidad y health checks según necesidad.
- [ ] Documentar operación, rollback y recuperación.

## Decisiones pendientes antes de implementar

- Versiones del stack y herramientas de paquetes.
- Proyectos físicos, namespaces y composition root.
- Firma y tipo temporal definitivos del port de reloj, implementación concreta y lifetime de DI.
- Controllers o Minimal APIs.
- Estrategia de `DbContext`, schemas y migrations.
- Modelo de dominio y relaciones iniciales de los cinco módulos conceptuales.
- Correspondencia definitiva entre módulos y Bounded Contexts, lenguaje ubicuo y límites transaccionales.
- Estructura física final de React, routing, providers y herramientas frontend adicionales.
- Storage persistente de multimedia y política de URLs externas para videos.
- Permisos y operación de Directus.
- Autenticación y autorización Directus → ASP.NET Core.
- Cobertura exacta de Filter Hooks por colección y operación.
- Contrato definitivo del formulario y catálogo final de tipos de solicitud.
- Proveedor de correo, destinatario configurable, `From`, `Reply-To`, asunto y plantillas.
- Política anti-spam/rate limiting, límites de tamaño, observabilidad y posible CAPTCHA.
- Persistencia histórica o no de solicitudes de contacto.
- Frameworks y alcance de testing.
- Estrategia global de errores/resultados y catálogo de mapping HTTP.
- Desarrollo local y deployment, incluido el posible uso de Docker.

El login o autenticación propia para personas, las cuentas de Cliente, los roles propios de ASP.NET Core y un panel administrativo en React no son decisiones pendientes: están fuera del alcance de la V1. La autenticación técnica Directus → ASP.NET Core sí permanece pendiente.
