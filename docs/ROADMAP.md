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
- [x] Proteger físicamente la portada única de Project mediante columna generada nullable y `UNIQUE`.
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

## Fase 5 — PoC de Directus en Hostinger

Directus permanece provisional hasta completar todos los puntos:

- [ ] Verificar ejecución de Node.js 22 en el Hostinger Business Web Hosting existente.
- [ ] Verificar conexión a MySQL de Hostinger.
- [ ] Inicializar tablas internas de Directus.
- [ ] Verificar Data Studio.
- [ ] Introspeccionar tablas del dominio creadas externamente.
- [ ] Ejecutar Filter Hooks bloqueantes.
- [ ] Verificar llamada Hook → NestJS.
- [ ] Verificar aprobación y rechazo de mutaciones.
- [ ] Verificar canonicalización del payload.
- [ ] Verificar persistencia posterior a aprobación.
- [ ] Probar ausencia de doble escritura.
- [ ] Verificar persistencia y comportamiento de uploads.
- [ ] Verificar carga de extensions.
- [ ] Verificar que uploads/extensions sobrevivan reinicio o redeploy.
- [ ] Documentar evidencia, riesgos y límites observados.
- [ ] Adoptar Directus mediante actualización de ADR-018 o, si falla, reconsiderar CMS en una nueva ADR sin asumir alternativa.

## Fase 6 — Integración administrativa, condicionada a PoC

- [ ] Completar ADR-023 y definir autenticación/autorización Directus → NestJS después de la PoC.
- [ ] Configurar mínimo privilegio para Administradores.
- [ ] Implementar endpoints internos sin inventar doble canal de persistencia.
- [ ] Implementar Filter Hooks por operación/colección necesaria.
- [ ] Probar error, aprobación, payload canónico y escritor final único.
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
- Autenticación Directus → NestJS según ADR-023 y permisos del CMS.
- Rutas, versionado, DTOs y estrategia de errores HTTP.
- Límites transaccionales y concurrencia.
- Efecto de desactivar Service/Category sobre Projects históricos.
- Exposición de ProjectPeriod.
- Storage de multimedia y videos externos.
- Proveedor/configuración de correo y política antiabuso.
- Persistencia histórica de ContactRequest.
- Formatter, lint, testing futuro de Application/API/frontend, observabilidad, caching y operación.

No son decisiones pendientes: cuentas de Cliente, autenticación propia, roles propios del backend y panel administrativo React están fuera de la V1.
