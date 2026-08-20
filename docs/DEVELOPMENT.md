# Desarrollo

Esta guía describe el desarrollo sobre la fundación Node.js/NestJS activa.

## Estado del entorno y transición

El backend posee `package.json` y `package-lock.json`. NestJS, `@nestjs/cqrs`, TypeORM/MySQL, Domain TypeScript y tests están configurados. El frontend no está implementado. Tampoco existen casos de uso Application, controllers, endpoints o Directus.

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
| Port requerido por un caso de uso | `modules/{Context}/{Context}.Application/Ports/I{Capability}Port.ts` |
| Validación de caso de uso | `modules/{Context}/{Context}.Application/Validations/{Name}.ts` |
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

Para una mutación administrativa, el Handler devuelve error, aprobación o payload canónico. Puede leer estado, pero no ejecuta el `INSERT`, `UPDATE` o `DELETE` final de la misma operación: Directus sería el escritor final único.

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

## Mutación administrativa y Directus

Este flujo solo se implementará si Directus supera la PoC:

1. Filter Hook bloqueante antes de persistir.
2. Llamada autenticada a un endpoint interno NestJS.
3. Request DTO → Command → `CommandBus` → Handler.
4. Lectura opcional mediante port/TypeORM.
5. Ejecución de Domain.
6. Error o payload canónico.
7. Cancelación o continuación del Hook.
8. Escritura final única de Directus.
9. Prueba explícita de ausencia de doble escritura.

La autenticación Hook → NestJS sigue pendiente según ADR-023. No elegir API key, JWT, OAuth, mTLS u otra opción sin completar esa decisión.

## PoC de Directus

La PoC en el **Hostinger Business Web Hosting existente** debe documentar evidencia de:

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
