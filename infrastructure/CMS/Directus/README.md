# Directus para Cromática Creativa

Aplicación administrativa independiente incorporada para HU09. Usa Directus `12.3.0`, requiere Node.js `>=22` y no forma parte del build de NestJS. Su deployment y la PoC completa en Hostinger Business Web Hosting siguen pendientes.

Fuentes oficiales consultadas:

- [paquete `directus` en npm](https://www.npmjs.com/package/directus);
- [CLI de Directus](https://docs.directus.io/self-hosted/cli);
- [opciones de configuración](https://docs.directus.io/self-hosted/config-options);
- [autenticación y Static Access Tokens](https://docs.directus.io/reference/authentication);
- [directorio de usuarios y generación de tokens](https://docs.directus.io/user-guide/user-management/user-directory);
- [Project Settings](https://docs.directus.io/user-guide/settings/project-settings);
- [API de colecciones](https://docs.directus.io/reference/system/collections) y [campos](https://docs.directus.io/reference/system/fields).

## Responsabilidades

- TypeORM Migrations crea y modifica exclusivamente `corporate_client`, `project`, `media`, `service`, `category`, `company_profile`, `phone`, `email`, `location` y `social_link`.
- Directus crea y administra exclusivamente sus tablas internas `directus_*` mediante su bootstrap oficial.
- Directus puede introspeccionar y administrar datos de las tablas de negocio, pero su Data Model no debe usarse para cambiar su estructura.
- La autenticación del Administrador, sus usuarios, sesiones, roles, policies y recuperación de contraseña pertenecen exclusivamente a Directus. NestJS y el futuro frontend React no participan.

## Preparación

1. Levante una instancia MySQL.
2. Cree `backend/.env` desde el ejemplo de la raíz y ejecute las TypeORM Migrations desde `backend/`.
3. Copie `.env.example` como `.env` en este directorio y sustituya todos los placeholders por valores locales reales.
4. Mantenga la equivalencia exacta:

   ```text
   backend MYSQL_HOST     = Directus DB_HOST
   backend MYSQL_PORT     = Directus DB_PORT
   backend MYSQL_DATABASE = Directus DB_DATABASE
   ```

   Ambos procesos abren conexiones propias, pero apuntan a una sola base MySQL. No cree una base separada para el CMS.

5. Genere un `SECRET` largo y aleatorio fuera de Git. Las credenciales del Administrador y de MySQL también permanecen solo en `.env` o en variables del entorno de deployment.

## Instalación, bootstrap e inicio

```powershell
cd infrastructure/CMS/Directus
npm ci
npm run bootstrap
npm run start
```

`npm run bootstrap` ejecuta el comando oficial `directus bootstrap`. En una base donde Directus aún no está instalado, crea sus tablas internas, aplica sus migrations y crea el primer usuario administrativo con `ADMIN_EMAIL` y `ADMIN_PASSWORD`. En ejecuciones posteriores actualiza las tablas internas que lo requieran; esas variables no crean repetidamente Administradores.

Después de iniciar, abra `http://localhost:8055/admin` (la raíz redirige al Data Studio de forma predeterminada) y autentíquese con el correo y la contraseña locales configurados.

El orden obligatorio es MySQL → TypeORM Migrations → comprobación de tablas de negocio → Directus bootstrap → Directus start. Nunca cree tablas `directus_*` mediante TypeORM ni tablas de negocio desde Directus.

## Credenciales: bootstrap, provisioning e integración interna

Las tres credenciales tienen responsabilidades independientes y no son intercambiables:

| Variable | Responsabilidad exclusiva |
| --- | --- |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Bootstrap inicial sobre una base vacía y acceso humano del primer Administrador. Después del bootstrap, cambiar o recuperar esa contraseña no afecta los scripts de provisioning. |
| `DIRECTUS_CONFIG_TOKEN` | Static Access Token server-side usado únicamente por `npm run brand` y `npm run configure:ui`. Los scripts lo envían como `Authorization: Bearer <token>` y no realizan login por correo/contraseña. |
| `BACKEND_INTERNAL_TOKEN` | Autenticación del Filter Hook de Directus hacia el backend NestJS. No se usa para branding ni para metadata administrativa. |

### Obtener y proteger `DIRECTUS_CONFIG_TOKEN`

Directus permite generar un Static Access Token en **User Directory → usuario → Admin Options → Token**. El usuario debe estar activo. Para separar la automatización del acceso humano, se recomienda crear manualmente un usuario técnico dedicado, asignarle el acceso necesario y generar su token desde esa pantalla; también puede pertenecer a un Administrador existente, pero su rotación y auditoría quedarían acopladas a esa identidad. Este repositorio no crea usuarios, roles ni policies automáticamente.

El token estático pertenece al usuario y hereda sus roles/policies. En Directus 12.3.0, `npm run configure:ui` necesita capacidad administrativa efectiva: crea/actualiza metadata mediante `/collections` y `/fields`, cuyos servicios rechazan identidades no administradoras. `npm run brand` actualiza `/settings` (Project Settings es solo para Administradores) y además lee/crea el isotipo mediante `/files`. Por tanto, para ejecutar ambos scripts sin cambiar su funcionalidad, el usuario técnico debe tener acceso de Administrador; ese acceso cubre:

- lectura y creación en `directus_files`, para localizar o subir el isotipo;
- actualización de `directus_settings`, para el branding y el theme;
- creación/actualización de metadata de colecciones;
- actualización de metadata de campos.

Al ser una credencial de larga duración guardada en texto plano por Directus, `DIRECTUS_CONFIG_TOKEN` solo se configura como secreto server-side en el `.env` local o en las variables de Hostinger. Nunca debe enviarse al navegador, al frontend, a módulos cliente o al backend NestJS; tampoco debe versionarse, imprimirse en logs ni escribirse con un valor real en este README.

### Secuencia local y futura en Hostinger

Primera instalación:

```powershell
cd infrastructure/CMS/Directus
npm ci
npm run bootstrap
npm run start
# En otra terminal, con Directus iniciado:
npm run brand
npm run configure:ui
```

En despliegues posteriores:

```powershell
cd infrastructure/CMS/Directus
npm ci
npm run start
# Solo cuando sea necesario reaplicar la configuración:
npm run brand
npm run configure:ui
```

En Hostinger se configurará `DIRECTUS_CONFIG_TOKEN=<secret-produccion>` como variable de entorno. La contraseña humana del Administrador podrá cambiarse o recuperarse sin romper estos dos scripts. Esta secuencia documenta el flujo previsto, pero no afirma que la topología de Hostinger esté validada.

## Comprobaciones de HU09

Con una instancia local real:

1. Compruebe en MySQL que existan primero las diez tablas de negocio y `typeorm_migration`.
2. Ejecute el bootstrap y compruebe que se agreguen tablas con prefijo `directus_` sin modificar las tablas de negocio.
3. Inicie Directus y abra el Data Studio.
4. Verifique login correcto con el Administrador inicial.
5. Verifique que una contraseña incorrecta y un correo inexistente sean rechazados.
6. Compruebe que el registro público no esté habilitado. Directus lo mantiene deshabilitado por defecto; no active la opción de registro público en Project Settings.
7. Compruebe que el endpoint público de registro permanezca inhabilitado.
8. En Data Studio, confirme que Directus reconoce las diez tablas creadas previamente por TypeORM. La metadata de presentación que Directus necesite puede vivir en sus tablas internas, pero no se modifica el esquema SQL desde Data Model.

## Recuperación y reset de contraseña

Directus incluye el flujo nativo para solicitar y completar un restablecimiento. El enlace usa `PUBLIC_URL` y el envío requiere configurar un transporte de correo real. Para SMTP, las variables oficiales están documentadas en `.env.example`; las credenciales siguen pendientes y no se versionan. Por ello, el envío real queda **PREPARADO / NO VERIFICADO** hasta disponer de SMTP.

Para desarrollo o emergencia, la CLI oficial permite cambiar una contraseña existente:

```powershell
npx directus users passwd --email <correo> --password <nueva-contraseña>
```

No copie contraseñas reales a documentación, historial de terminal compartido o Git.

## Registro público

El registro de usuarios está deshabilitado de forma predeterminada en Directus. HU09 conserva ese valor y no configura proveedores SSO con registro automático. Las cuentas administrativas se aprovisionan previamente mediante bootstrap o gestión autenticada de Directus; no existe un flujo público “Crear cuenta” o “Registrarse”.

## Extensión de CompanyProfile — Filter Hook

`extensions/company-profile/` es la extensión estable de tipo `hook` (Directus 12.3.0) del módulo CompanyProfile. Se organiza por módulo/Bounded Context, no por Historia de Usuario, y crece de forma incremental. Su alcance implementado cubre estas rutas explícitas:

- HU22 "Agregar información de contacto": `phone`, `email` y `social_link` → `POST /internal/cms/company-profile/contact-information`.
- HU24 "Agregar ubicación": `location` → `POST /internal/cms/company-profile/location`.
- Correo receptor: `company_profile.items.update`, solo cuando cambia `contact_request_recipient_email`, → `POST /internal/cms/company-profile/contact-request-recipient-email`.

El Hook interviene en los CREATE y UPDATE de datos de negocio descritos en este documento. No interviene en DELETE: la UI elimina directamente mediante Directus conforme a ADR-019, sin endpoint NestJS.

Flujo por cada creación (`<colección>.items.create`):

1. el Hook envía `{ collection, payload }` a la ruta interna correspondiente en `${BACKEND_INTERNAL_URL}`;
2. se autentica con `Authorization: Bearer ${BACKEND_INTERNAL_TOKEN}` (ADR-023);
3. NestJS valida, normaliza y decide; si aprueba, devuelve el payload canónico y el Hook lo aplica con **allowlist**: los valores de negocio, `company_profile_id` y `display_order` provienen siempre del backend, solo se preserva el `id` técnico generado por Directus, y los campos desconocidos o suplantados por el Administrador **no** sobreviven;
4. si NestJS rechaza (4xx/5xx), no responde, agota el tiempo de espera o devuelve algo inesperado, el Hook lanza un error y Directus **no** persiste (fail closed).

**Errores estructurados (sin `[INTERNAL_SERVER_ERROR]`).** El backend responde a un rechazo de negocio con un cuerpo `{ statusCode, message, errors: [{ field, message }] }` (422 validación, 409 conflicto/duplicado). El Hook relanza ese rechazo como **DirectusError(s)** hechos a mano (`name: 'DirectusError'`, `code`, `status`, `extensions`), sin importar `@directus/errors` (se mantiene el Hook como ESM plano). Como el manejador de errores oficial de Directus reconoce un error por `name === 'DirectusError'` (`isDirectusError`) y respeta su `status`/`code`, la respuesta deja de etiquetarse como **INTERNAL_SERVER_ERROR**: un 422 usa `code: FAILED_VALIDATION`, un 409 usa `RECORD_NOT_UNIQUE`, un 400 usa `INVALID_PAYLOAD`, y `extensions.field` lleva la **columna** de Directus (`number`, `address`, `network`, `url`, `latitude`, `longitude`). Cuando el backend devuelve **varios** `errors[]` de la misma operación (por ejemplo, dirección + latitud + longitud), el Hook los lanza como un **arreglo** de DirectusError con el mismo `status`; el manejador de Directus acepta arreglos (`Array.isArray(err) ? err : [err]`) y los devuelve juntos en `errors[]`. Todos comparten status para que Directus no degrade la respuesta a 500.

Mensajes al Administrador: solo los status de negocio de una allowlist explícita (**400, 409, 422**) propagan el/los mensaje(s) seguros del backend (`errors[].message`, o `message` general si no hay `errors[]`; por ejemplo, "La dirección de correo electrónico no es válida.", "Este correo electrónico ya está registrado." o "La latitud debe estar entre -90 y 90."). Cualquier otro status (401, 403, 404, 405, 429, 5xx, etc.), timeout o caída de red produce un único DirectusError genérico (`SERVICE_UNAVAILABLE`, "No fue posible procesar la solicitud en este momento.") y nunca expone Unauthorized/Forbidden/Not Found, SQL, stack traces, rutas internas ni secretos. Los logs técnicos incluyen solo la colección, la ruta y el status.

Variables (en `.env`, nunca versionadas): `BACKEND_INTERNAL_URL`, `BACKEND_INTERNAL_TOKEN` (idéntico a `CMS_INTERNAL_TOKEN` del backend) y, opcional, `BACKEND_INTERNAL_TIMEOUT_MS` (por defecto 5000). Si faltan URL o token, el Hook cancela toda operación CREATE/UPDATE interceptada sin contactar al backend.

La extensión es JavaScript ESM sin build: Directus la carga desde su `package.json` (`directus:extension.type = hook`) y la habilita automáticamente. Directus realiza los INSERT/UPDATE finales aprobados y ejecuta los DELETE directamente; TypeORM Migrations conserva la autoridad estructural.

## Información General — UI administrativa (HU22 y HU24)

Experiencia administrativa para listar, agregar, editar y eliminar teléfonos, correos públicos, redes sociales y la ubicación; también permite cambiar el correo receptor.

### Mecanismo elegido: Custom Interface compilada y metadata de montaje

La experiencia vive en `extensions/company-info-manager/`, una Custom Interface Vue compilada. `configure-informacion-general.mjs` usa metadata de Directus únicamente para montarla en el singleton y ocultar los campos/alias nativos reemplazados; no cambia el schema TypeORM.

- La interfaz usa la sesión autenticada mediante `useApi`; no expone tokens técnicos.
- Cada alta y modificación usa la Items API y dispara el Filter Hook correspondiente. Los DELETE se ejecutan directamente en Directus conforme a la decisión vigente descrita más adelante.

**Flujo de cada alta desde el singleton:**

```
Formulario singleton → PATCH /items/company_profile → procesador O2M de Directus
  → <child>.items.create → Filter Hook company-profile
  → endpoint interno NestJS (server-side, Bearer CMS_INTERNAL_TOKEN) → Command → Domain/Application
  → payload canónico o error → Directus (escritura final) → MySQL
```

El `CMS_INTERNAL_TOKEN`/`BACKEND_INTERNAL_TOKEN` **nunca** llega al navegador: la UI solo usa la API autenticada de Directus; el Hook contacta a NestJS del lado del servidor. Los mensajes de negocio (422/409/400) del backend se muestran al Administrador vía el Hook; los errores técnicos muestran un mensaje genérico (ver sección del Hook).

### Qué configura (colecciones reutilizadas, sin tocar el schema)

Se reutilizan las tablas existentes (propiedad de TypeORM): `company_profile` (singleton), `phone`, `email`, `social_link`, `location`. No se crean tablas, columnas ni FKs.

- Nav habitual: un único punto de entrada top-level **"Información General"** (`company_profile`). La carpeta anterior y las cuatro colecciones child quedan ocultas, pero siguen disponibles técnicamente mediante "Mostrar colecciones ocultas".
- Formulario central: cuatro alias O2M nativos y virtuales (`schema: null`), en este orden: `phones` → **Teléfonos**, `emails` → **Correos públicos**, `social_links` → **Redes sociales**, `location` → **Ubicación**.
- Interfaces `list-o2m`: muestran registros actuales y permiten **Crear nuevo**; seleccionar existentes y abrir enlaces directos están deshabilitados. La FK sigue viviendo exclusivamente en `child.company_profile_id`.
- Ubicación 0..1: `location.company_profile_id` es PK/FK única. Directus detecta esa unicidad y oculta la creación cuando ya existe una fila; el backend también conserva la invariante.
- Campos técnicos **ocultos** (`id`, `company_profile_id`, `singleton_key`, `display_order`): el backend los canonicaliza; el Administrador no los ve ni fija.
- `phone.id`/`email.id`/`social_link.id` con `special: uuid` para que Directus autogenere la PK en cada alta (el alta es un create de nivel superior → dispara el Hook; el Hook preserva ese `id` en su allowlist).
- Campos de negocio con etiquetas/ayudas/placeholders en español y `required` (asterisco de obligatorio, no de error):
  - **Número de teléfono** (`+58 412 1234567`) — ayuda: "Debe comenzar con el código de país precedido por '+', seguido del número de teléfono."
  - **Correo electrónico** (`contacto@empresa.com`) — ayuda: "Escriba una dirección de correo válida."
  - **Red social** — interfaz `select-dropdown` con las redes frecuentes (Instagram, Facebook, WhatsApp, LinkedIn, TikTok, YouTube, X (Twitter), Pinterest, Telegram) y **`allowOther: true`**: la opción nativa "Otra" permite escribir una red no listada, cuyo texto se envía tal cual a `network`. **Nunca** se guarda literalmente "Otra" (por eso no hay una opción con valor "Otra"), y no se agrega ninguna columna: el select y el "Other" nativo escriben al mismo campo `network`. Es **solo UX**: el Domain sigue abierto (`SocialLink` acepta cualquier red; WhatsApp sigue siendo `SocialLink`).
  - **URL** (`https://instagram.com/cromaticacreativa`) — ayuda: "Escriba la URL completa … comenzando con http:// o https://."
  - **Dirección** — ayuda con ejemplo de dirección completa y mínimo estructural de 10 caracteres; sigue siendo **manual** (sin validación de existencia geográfica).
  - **Latitud** (-90 a 90, ej. 10.4806) y **Longitud** (-180 a 180, ej. -66.9036).
  - En el singleton, **`Correo receptor de solicitudes`** (antes "Contact Request Recipient Email") — ayuda: "En este correo se recibirán las solicitudes enviadas por los clientes desde el formulario de contacto del sitio web." Solo cambia la etiqueta visible; la columna física `contact_request_recipient_email` no cambia.
- La validación definitiva sigue en Domain/Application; la UI solo marca "requerido" como ayuda, sin duplicar reglas. El backend acumula y devuelve **todos** los errores de una misma operación (por ejemplo, dirección + latitud + longitud), de modo que se muestran juntos en vez de uno por uno.

Los cuatro alias tienen `type: alias`, `special: ["o2m"]` y `schema: null`. La verificación antes/después mediante `SHOW CREATE TABLE` produjo hashes idénticos para las cinco tablas; solo se agregó metadata en `directus_fields`/`directus_relations`.

### Aplicar (local y Hostinger)

Requisito: Directus en ejecución, `DIRECTUS_CONFIG_TOKEN` con acceso de Administrador y `DIRECTUS_URL`/`PUBLIC_URL` en el entorno o `.env`. Idempotente (usa PATCH):

```powershell
cd infrastructure/CMS/Directus
npm run configure:ui                                            # metadata de la UI (idempotente)
$env:COMPANY_RECIPIENT_EMAIL="correo@empresa.com"; npm run seed:profile   # crea el singleton (idempotente)
```

Como la metadata vive en `directus_*` (MySQL), persiste a `npm ci`/rebuilds/reinicios; en Hostinger basta reejecutar `npm run configure:ui` y `npm run seed:profile` tras el bootstrap. Alternativa manual: Settings → Data Model, con los mismos valores.

### Registro singleton `company_profile` (reproducible)

HU22/HU24 exigen que el perfil exista (los hijos referencian `company_profile_id`). Se crea con un script idempotente que toma el correo receptor de la variable `COMPANY_RECIPIENT_EMAIL` (`contact_request_recipient_email`, `NOT NULL`) — **no** se hardcodea:

```powershell
cd infrastructure/CMS/Directus
$env:COMPANY_RECIPIENT_EMAIL="correo@empresa.com"; npm run seed:profile
```

Usa la Items API de Directus (colección singleton → `PATCH /items/company_profile` con un `id` UUID). Idempotente: si el singleton ya existe, no hace nada. `company_profile` no tiene Filter Hook (es la inicialización del perfil, no una mutación de negocio).

### Paso operativo pendiente: rol "Editor de contenido"

Se recomienda un rol **no-administrador** con lectura y actualización limitada del singleton y permisos `create` + `read` + `update` + `delete` acotados sobre `phone`/`email`/`social_link`/`location`. El rol Administrador **omite** permisos (Directus). No se automatiza aquí por la API de policies/permissions de Directus 11+; configúrelo en Settings → Access Control. Directus aplica estos permisos tanto a CREATE/UPDATE como al DELETE directo.

### Verificación E2E realizada (local)

Aplicado y **verificado de punta a punta** con Directus (`:8055`) + NestJS (`:3000`) + MySQL:

- `npm run configure:ui`: nav "Información General", secciones en español (Teléfonos/Correos públicos/Redes sociales/Ubicación), campos técnicos ocultos, `id` autogenerado (`uuid`) — comprobado por API.
- Nested creates desde `PATCH /items/company_profile` confirmaron empíricamente los cuatro eventos child y la propagación del mensaje Domain: teléfono inválido, correo inválido, URL inválida y latitud inválida devolvieron sus mensajes específicos. Los conteos child permanecieron en cero, por lo que cada transacción fallida fue anulada.
- `npm run seed:profile`: singleton creado (correo receptor elegido por el negocio).
- **12 casos de alta vía Items API → Hook → NestJS → Domain → Directus → MySQL** (todas esas altas pasaron por el Hook; NestJS validó sin persistir; los mensajes de negocio llegaron a la respuesta; los inválidos/duplicados no se persistieron):
  - Teléfono: válido → `+584121234567`; inválido → "…no corresponde a un plan de numeración válido."; duplicado → "El teléfono '…' ya está registrado.".
  - Correo: válido → dominio en minúsculas (`Contacto@gmail.com`); inválido → "La dirección de correo electrónico no es válida."; duplicado → "El correo '…' ya está registrado.".
  - Red social: válida; URL inválida → "La URL debe ser una URL HTTP o HTTPS válida."; red duplicada (case-insensitive) → "Ya existe un enlace para la red '…'."; WhatsApp sigue siendo `SocialLink`.
  - Ubicación: válida; latitud fuera de rango → "La latitud debe estar entre -90 y 90."; longitud fuera de rango → "La longitud debe estar entre -180 y 180."; 2.ª ubicación → "La empresa ya tiene una ubicación registrada…".

**Defecto corregido durante la verificación:** el Filter Hook leía `process.env`, pero Directus 12.3.0 no expone las variables custom del `.env` en `process.env`. Ahora lee del `env` del contexto del Hook (con respaldo a `process.env`). Sin este fix, toda alta caía en "falta la variable de entorno 'BACKEND_INTERNAL_URL'".

**Limitaciones observadas:**

- **Errores de negocio ya no salen como `[INTERNAL_SERVER_ERROR]`.** El Hook ahora lanza DirectusError(s) con `status`/`code` propios (422 `FAILED_VALIDATION`, 409 `RECORD_NOT_UNIQUE`, 400 `INVALID_PAYLOAD`), por lo que Directus responde con ese status y el prefijo interno desaparece. **Pendiente de verificar en navegador** (entorno headless): si la app de Directus asocia cada error `FAILED_VALIDATION` con `extensions.field` a un **campo concreto dentro del drawer relacional** (resaltado inline) o solo lo muestra como notificación con varios mensajes. La respuesta de la API ya es correcta y está cubierta por tests; el mapeo inline campo-a-error dentro de un drawer de creación anidada es comportamiento del front-end de Directus que no pudo comprobarse sin instancia + navegador. Si en la práctica no se resalta inline dentro del drawer, conseguir ese resaltado exacto requeriría una **Custom Interface** (App Extension compilada), fuera del alcance actual.
- La interfaz nativa muestra su texto genérico de lista vacía. La nota de Ubicación aclara "no se ha registrado una ubicación", pero personalizar exactamente el empty-state requeriría una interfaz propia.
- El modo add-only depende del rol editor. Un Administrador siempre conserva acceso completo y puede abrir colecciones ocultas para soporte/desarrollo.
- La columna `email.address` usa collation **case-insensitive**; el Domain preserva mayúsculas en la parte local. Dos correos que difieran **solo** en la caja de la parte local (p. ej. `Contacto@…` vs `contacto@…`) se aceptan en Domain pero MySQL los rechaza con un mensaje de unicidad (400), no con el mensaje de negocio. El duplicado idéntico sí muestra el mensaje de negocio.

Esta metadata vive en tablas internas `directus_*` y no altera columnas, constraints ni relaciones de negocio.

## Selector de ubicación administrativo (OpenStreetMap + Leaflet)

Para HU24 el Administrador **no debe escribir coordenadas a mano**: el gestor incluye un mapa con buscador para elegir el punto; rellena `latitude`/`longitude` y deja la **Dirección como campo manual**. **No usa Google Maps, ni `GOOGLE_MAPS_API_KEY`, ni Google Cloud billing.**

### Mecanismo (fuente única de verdad)

- El mapa es un **componente interno reutilizable** del gestor: `company-info-manager/src/components/OsmLocationPicker.vue`, que consume la lógica compartida `company-info-manager/src/composables/useOsm.ts` (constantes, Nominatim, `tileLayer`, marcador, click, drag, `invalidateSize`, redondeo, mensajes). **Una sola implementación**: la antigua extensión independiente `osm-location-picker` fue **retirada** (su mapa se duplicaba). Ya no existe el campo `location.mapa`.
- El componente **emite** las coordenadas elegidas al formulario del gestor (`latitude`/`longitude`, readonly). Al Guardar, el gestor hace `POST /items/location` → `location.items.create` (Filter Hook) → NestJS valida → payload canónico → Directus (único escritor) → MySQL. No expone ningún token ni llama al backend directamente.
- `latitude`/`longitude` se muestran **readonly** (solo UX); el backend/Domain sigue validando el rango (-90..90 / -180..180). Si alguien manipula la request (p. ej. `latitude = 999`), el backend la rechaza igual.

### Buscador (Nominatim) y política

- Servicio de búsqueda: **Nominatim** (`https://nominatim.openstreetmap.org/search`, `format=jsonv2`, `limit=8`, `Accept-Language: es`).
- **Uso responsable** conforme a la [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/): la búsqueda se dispara con un **botón "Buscar"** (no por cada tecla, sin autocomplete agresivo), con **timeout** (8 s), **límite de resultados** (8), manejo de **error/red/timeout/vacío** y mensajes UX en español. El panel lo usan muy pocos administradores, así que el tráfico es mínimo; aun así, para volumen alto conviene un Nominatim propio o un proveedor con términos adecuados.
- Resultados: se muestran hasta 8; al seleccionar uno se centra el mapa, se coloca el marcador y se rellenan lat/long. **No** guarda automáticamente (Guardar sigue siendo explícito) y **no** sobrescribe la Dirección. Como referencia se muestra "Ubicación encontrada: …" y un botón **opcional** "Usar esta dirección" que **solo con click** copia ese texto al campo Dirección.

### Mapa (Leaflet) y tiles

- **Leaflet** con tiles de **OpenStreetMap** en el host moderno sin subdominios: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`. Se conserva la **atribución obligatoria** "© OpenStreetMap contributors" (no se oculta). Revise la [Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/): apta para tráfico bajo como este panel; el proveedor de tiles puede cambiarse en el futuro editando la URL de `L.tileLayer` en la extensión, sin tocar Domain/DB.
- Interacción: buscar → seleccionar resultado, **click** en el mapa, o **arrastrar** el marcador (único marcador). Cualquiera de ellas actualiza lat/long. La ubicación es 0..1: el mapa aparece al crear cuando no existe ninguna.
- **`invalidateSize`**: el mapa se recalcula tras montar (`requestAnimationFrame` + un `setTimeout(250)`) y ante cada resize del contenedor (un `ResizeObserver`), para evitar el mapa gris/cortado al abrir el drawer o cambiar de tamaño/orientación. No se ejecuta en bucle.
- Marcador con **`L.divIcon`** (emoji), para no depender de assets de icono por URL frágil ni de bundling de PNG.

### CSP y tiles (causa del "mapa gris")

**CSP anterior real** (Directus 12.3.0, `@directus/api/dist/app.js`, sin overrides locales): `img-src 'self' data: blob: https://raw.githubusercontent.com https://avatars.githubusercontent.com` y `connect-src 'self' https://* wss://*`. El primer valor no incluye OpenStreetMap y produce `(blocked:csp)` en los PNG. El segundo permite todo HTTPS, más de lo que necesita este gestor.

**CSP final**: Directus admite `CONTENT_SECURITY_POLICY_*`; `DIRECTIVES__IMG_SRC` y `DIRECTIVES__CONNECT_SRC` se transforman en las directivas anidadas de Helmet. El cast `array:` separa los orígenes y cada override **sustituye la directiva completa**, por lo que hay que conservar explícitamente los defaults necesarios. En el `.env` de Directus (ver `.env.example`):

```
CONTENT_SECURITY_POLICY_DIRECTIVES__IMG_SRC=array:'self',data:,blob:,https://raw.githubusercontent.com,https://avatars.githubusercontent.com,https://tile.openstreetmap.org
CONTENT_SECURITY_POLICY_DIRECTIVES__CONNECT_SRC=array:'self',https://nominatim.openstreetmap.org,wss://*
```

`img-src` conserva `'self'`, `data:`, `blob:` y los dos hosts de imagen usados por Directus, y añade únicamente `https://tile.openstreetmap.org`; no se autoriza `*.tile.openstreetmap.org` porque `L.tileLayer` no usa `{s}`. `connect-src` conserva `'self'` y el origen WebSocket predeterminado de Directus, reemplaza el permisivo `https://*` y autoriza únicamente `https://nominatim.openstreetmap.org` como conexión HTTPS externa.

La CSP se lee **al iniciar**: (1) detener Directus, (2) actualizar `.env`, (3) iniciar Directus otra vez y (4) hacer `Ctrl+F5`. `Ctrl+F5` por sí solo no sirve porque el header CSP lo genera el servidor durante el arranque. Después, en DevTools → Network, los PNG de `tile.openstreetmap.org` deben responder `200` en lugar de `(blocked:csp)`, y buscar "Plaza Altamira Caracas" debe generar una request permitida a `nominatim.openstreetmap.org/search`. Si ninguna tile carga, la UI muestra "No fue posible cargar el mapa. Inténtalo nuevamente.".

### Build y carga

El mapa se compila como parte del gestor (no hay extensión de mapa aparte). Ver la sección del gestor para el build de `company-info-manager` (`npm ci && npm run build`). `npm run configure:ui` **retira** el campo `location.mapa` (borrado idempotente de metadata; al ser alias/`schema:null` **no** hay migración SQL) y monta el gestor. La lógica del mapa (Leaflet + CSS) queda dentro de `company-info-manager/dist/index.js`.

### Deploy en Hostinger

`npm ci && npm run build` de `company-info-manager` (produce `dist/`), reiniciar Directus, definir las dos variables CSP y ejecutar `npm run configure:ui`. No requiere Google Cloud ni tarjeta de crédito; no depende de `node_modules` modificado a mano. La búsqueda usa el Nominatim público (tráfico bajo) y los tiles OpenStreetMap.

### Verificación

Compila localmente dentro del gestor (`company-info-manager/dist/index.js` incluye Leaflet + CSS) — **verificado**. La verificación **visual/E2E en el navegador** (carga del mapa, búsqueda, click/drag, readonly, responsive a 1920/1366/768/390, `invalidateSize` en el drawer) **queda pendiente de un entorno con Directus + navegador**: no puede comprobarse headless. El backend de HU24 y sus tests no cambian.

### Web pública futura (decisión, no implementada aquí)

El Domain y MySQL solo conocen `address`/`latitude`/`longitude` — **agnósticos de proveedor** (no guardan Place ID, URL de Google, ni metadata de OSM/Leaflet). Esto permite que la administración use **OpenStreetMap + Leaflet** y que la **web pública futura** (React → NestJS → lat/long) muestre la ubicación con **Google Maps Embed** (solo visualización con pin), sin cambiar Domain/Application/MySQL. Esa página pública React **no** se implementa en esta tarea.

## Gestor de Información General (creación con guardado inmediato)

Corrige el **doble guardado** y los errores técnicos del flujo relacional nativo. La extensión **Custom Interface** `extensions/company-info-manager/` reemplaza los alias O2M para la **creación** de children: cada "Crear nuevo" hace una mutación **top-level** con la Items API de Directus, que persiste al pulsar **Guardar una sola vez**.

### Diagnóstico (por qué el flujo anterior fallaba)

Confirmado leyendo el código instalado de Directus 12.3.0:

- **Doble guardado / `company_profile_id` nulo.** Los alias O2M en el singleton hacían **creates anidados y staged**: al pulsar "Guardar" en el drawer el child quedaba en memoria dentro de `company_profile`, y solo se enviaba con el **"Guardar" global** como `company_profile.items.update` con `{ <alias>: { create: [...] } }`. En ese anidamiento, el `company_profile_id` del child lo resuelve la relación **después**, por lo que el Hook podía verlo nulo → `company_profile_id: El valor no puede ser nulo`. Con un create **top-level** (`POST /items/phone`), el Hook llama a NestJS, que devuelve el `company_profile_id` canónico del singleton, y Directus inserta con ese valor.
- **`number: validationError.undefined`.** El formulario nativo, ante un error del Hook con `code: FAILED_VALIDATION`, muestra `t('validationError.' + extensions.type)` e **ignora nuestro `message`**; sin `type` imprime la clave literal `validationError.undefined`. La Custom Interface **no** depende de esa traducción: lee el array `errors[]` de la respuesta de la Items API y muestra el `message` real inline por campo.

### Cómo funciona

```
Navegador (sesión Directus, useApi) → POST /items/phone|email|social_link|location
  → <coll>.items.create (Filter Hook) → NestJS valida → payload canónico
  → Directus INSERT (único escritor) → MySQL
  → la interfaz refresca la lista
```

- **Sesión, no token.** Usa `useApi()` del `@directus/extensions-sdk` (instancia autenticada con la sesión actual). **No** expone `BACKEND_INTERNAL_TOKEN`/`DIRECTUS_CONFIG_TOKEN`/`CMS_INTERNAL_TOKEN` (verificado: no aparecen en `dist`). El navegador solo habla con Directus; el Hook contacta a NestJS server-side.
- **Un solo Guardar.** Válido → INSERT inmediato, se cierra el formulario y se refresca la lista (sin "Guardar" global). Inválido → **no** INSERT, el formulario permanece abierto con los datos, y los mensajes reales del backend salen **inline por campo** (mapeando `errors[].extensions.field` → `number`/`address`/`network`/`url`/`latitude`/`longitude`); varios errores de la misma operación se muestran juntos.
- **Select de redes estable.** El `<select>` conserva el valor en `form.network` mediante un `change` local que no se propaga al formulario host de Directus. Las opciones conocidas guardan su nombre (`Instagram`, `WhatsApp`, etc.); `Otra` mantiene `form.network === "__otra__"`, muestra el campo **Nombre de la red social o canal** y envía el nombre escrito, nunca `Otra`/`__otra__`. Un rechazo de URL no limpia red, URL ni nombre personalizado; solo Cancelar o un guardado exitoso cierran/reinicializan el formulario.
- **Cards con contraste local.** `.cim-sec` usa el token neutro `--theme--border-color` (fallback `#cfd4dc`) en lugar del borde subdued; `.cim-form` queda contenido con fondo y borde subdued. Las filas guardadas conservan fondo claro sin parecer inputs. El rojo `--theme--danger` continúa reservado a campos inválidos y errores.
- **Loading / doble submit.** El botón Guardar se deshabilita y muestra "Guardando…" durante la validación.
- **Backend caído / técnico.** El Hook devuelve genérico → la interfaz muestra "No fue posible procesar la solicitud en este momento." y **no** persiste (fail closed). No hay fallback ni guardado para validar después.
- **Ubicación.** Incluye el buscador + mapa Leaflet/OSM (componente interno `OsmLocationPicker.vue`): elegir/click/arrastrar fija `latitude`/`longitude` (readonly), la Dirección es manual, 0..1. Guardar hace `POST /items/location` (HU24 sin cambios).

### Modificar (HU23/HU25): edición con lápiz, un solo Guardar

Cada registro de Teléfonos/Correos/Redes/Ubicación ofrece un **lápiz** (Editar) junto a la papelera (ambos íconos ampliados, con `aria-label`/`title` y foco visible). Al pulsar el lápiz, el formulario de esa sección se abre **prellenado** con los valores actuales (en Redes, el select muestra la red actual, o "Otra" + el nombre si no está en la lista; en Ubicación, el mapa se centra en las coordenadas guardadas). Solo un formulario por sección a la vez.

Al Guardar (una vez), el gestor hace un **PATCH top-level** con la sesión (`useApi`; sin tokens):

```
PATCH /items/phone|email|social_link|location/:id
  → <coll>.items.update (Filter Hook; el id viaja en meta.keys)
  → /internal/cms/company-profile/{contact-information|location}/modify (Bearer server-side)
  → ModificarInformacionDeContactoCommand (Strategy por tipo) / ModificarUbicacionCommand
  → Domain (changePhone/changeEmail/changeSocialLink por valor; Address/GeoCoordinates)
  → payload canónico → Directus UPDATE (único escritor) → MySQL
```

- **Mismas validaciones que Agregar** (mismos Value Objects y `ValidadoraTelefono`/`ValidadoraCorreo`/`ValidadoraRedSocial`): un dato es válido/ inválido igual al crear y al modificar. Errores inline por campo; el formulario permanece abierto y conserva los datos si el backend rechaza.
- **Duplicado excluyendo el propio registro**: guardar sin cambiar el valor no se considera duplicado; chocar con **otro** registro sí (mensajes: "Este número de teléfono ya está registrado.", "Este correo electrónico ya está registrado.", "Ya existe una red social registrada con ese nombre.").
- **Identidad sin ids en el Domain**: el id del registro (de `meta.keys`) se resuelve a su valor único actual en Infrastructure (`IChildActualReader`); el Aggregate opera por valor. `company_profile_id`/`display_order` no se tocan; la respuesta de update no los incluye.
- **Allowlist estricta en el update**: el Hook aplica **solo** los campos canónicos que devuelve el backend (`number` / `address` / `network`+`url` / `address`+`latitude`+`longitude`); los campos que el navegador intente colar (`company_profile_id`, `display_order`, `id`) **no** sobreviven. El id viaja en `meta.keys`, no en el payload. Las lecturas de valor actual por id están **acotadas al perfil singleton** (`IChildActualReader`), de modo que un id manipulado nunca resuelve un child ajeno.
- **Single writer / fail closed**: NestJS valida pero **no** hace TypeORM update; Directus es el único escritor. Backend caído → "No fue posible procesar la solicitud en este momento." y no persiste.

**Selector de red social (dropdown propio).** El `<select>` HTML nativo **no** fija el valor dentro del formulario host de Directus (el evento `change` no se confirma), por lo que se usa un **dropdown propio basado en `click`** con `form.network` como única fuente de estado (accesible: `role="listbox"`/`option`, foco visible, cierre al hacer click fuera). Muestra las redes frecuentes + "Otra" (que revela el campo de nombre); nunca guarda literalmente "Otra". Prellena la red actual al editar.

### Eliminación directa (Directus, sin NestJS)

ADR-019 establece este flujo como la decisión arquitectónica vigente, no como una solución temporal ni como deuda técnica. Cada registro de las cuatro secciones ofrece una acción **Eliminar** (papelera). Como **eliminar no tiene regla de negocio adicional**, la operación va **directa a Directus** (no pasa por NestJS ni por un Hook): `DELETE /items/<phone|email|social_link|location>/:id` con la **sesión autenticada** (`useApi`; sin `BACKEND_INTERNAL_TOKEN`/`DIRECTUS_CONFIG_TOKEN`). Se hace **por id del child** (para `location`, su PK `company_profile_id`), nunca anulando `company_profile_id` ni con un update anidado.

- **Confirmación explícita** antes de borrar: diálogo "¿Seguro que deseas eliminar este dato?" + descripción por tipo ("Se eliminará el número +58…", "Se eliminará el correo…", "Se eliminará Instagram.", "Se eliminará la ubicación registrada.") y botones **Cancelar** / **Eliminar** (destructivo). Cancelar no hace request ni cambia nada.
- **Persistencia inmediata**: al confirmar, DELETE y refresco de la lista (sin "Guardar" global). Botón deshabilitado con "Eliminando…" (anti doble-click).
- **Errores seguros**: "No fue posible eliminar este dato. Inténtalo nuevamente." (o "No tienes permiso para eliminar este dato." en 403); nunca SQL/stack/tabla/status.
- **Ubicación**: al eliminar, la sección vuelve a "Sin ubicación registrada" y reaparece "Crear nuevo".
- **Correo receptor**: **no** tiene botón Eliminar (pertenece al singleton y es obligatorio; solo se modifica por su flujo validado).
- **Permisos**: el rol que use el gestor necesita permiso `delete` en `phone`/`email`/`social_link`/`location`. El rol **Administrador** de Directus omite permisos (puede borrar). No abrir `delete` a roles públicos.
- **CREATE/UPDATE vs DELETE**: crear y modificar requieren backend (Hook → NestJS); eliminar es Directus directo. Con el backend **apagado**, CREATE/UPDATE fallan (correcto), pero una eliminación **funciona** porque Directus aplica autenticación, autorización, confirmación y ejecuta el DELETE. Si en el futuro aparece una regla de negocio al eliminar, deberá reevaluarse esa operación concreta y podrá pasar por Application/Domain mediante un Hook y endpoint.

### Correo receptor de solicitudes (guardado propio, sin Guardar global)

El correo receptor **se edita y guarda dentro del gestor**, con su input y su propio botón **"Guardar"** (inline en desktop, apilado en móvil; el campo nativo del singleton queda `hidden`). El botón está **deshabilitado si el valor no cambió** respecto al persistido, muestra "Guardando…" durante el envío y "Correo actualizado correctamente." al aprobar. Al pulsarlo, el gestor hace `PATCH /items/company_profile` con la sesión (`useApi`; sin tokens) → Filter Hook `company_profile.items.update` (**solo si el payload incluye `contact_request_recipient_email`**) → `POST /internal/cms/company-profile/contact-request-recipient-email` → `AgregarInformacionDeContactoCommand` → `AgregarCorreoReceptorStrategy` → `CompanyContactInformation.changeContactRequestRecipientEmail(...)`. `ValidadoraCorreo` comparte con el correo público la construcción de `EmailAddress` y devuelve el valor canónico; NestJS **no** guarda y Directus persiste después o aborta. HU23 completa sigue pendiente.

Mensajes inline compartidos por `ValidadoraCorreo`: obligatorio, vacío, formato con ejemplo, dominio completo, TLD válido y longitud máxima. Presentation asocia el mismo campo Application `correo` con `address` para el correo público o con `contact_request_recipient_email` para el receptor; no existen dos mecanismos de validación.

**Regla de `EmailAddress` reforzada (compartida con los correos públicos).** Ahora exige `usuario@dominio.tld` con **TLD de solo letras y ≥2 caracteres**, por lo que se rechaza `cromaticacreativa00@gmail.c` (antes se aceptaba porque la última etiqueta admitía 1 carácter). No hay whitelist de proveedores: siguen válidos `gmail.com`, `empresa.com.ve`, `empresa.net`, `organizacion.org`, `universidad.edu`, etc. La misma regla aplica al **correo público** (mismo Value Object): `correo@gmail.c` también se rechaza. La UI de Directus solo aporta `type=email`/`required`; la autoridad es Domain (no se copia la regex a Vue).

### Botón "Guardar" global (oculto solo en Información General)

Con cada dato (teléfonos/correos/redes/ubicación) y el correo receptor guardándose por su propio botón, el **"Guardar" global** del encabezado ya no participa. Se **oculta solo en esta pantalla**: el gestor añade la clase `cc-info-general` a `<body>` mientras está montado (solo ocurre en la pantalla `company_profile`) y el Custom CSS (`branding/custom.css`, aplicado con `npm run brand`) contiene `body.cc-info-general .header-bar .actions … { display:none }`. El **scope lo garantiza la clase** (no existe fuera de esta pantalla), así que **no afecta a otras colecciones** aunque el selector interno del botón cambie entre versiones de Directus (en ese caso se ajusta el selector en `custom.css`). No se usa un `display:none` global sobre `.v-button`.

### Build y registro

Extensión compilada (su `dist/` no se versiona):

```powershell
cd infrastructure/CMS/Directus/extensions/company-info-manager
npm ci        # o npm install
npm run build # dist/index.js (Vue + Leaflet + CSS)
```

Luego `npm run configure:ui` (idempotente, `DIRECTUS_CONFIG_TOKEN`) monta el gestor en `company_profile.informacion_general`, **oculta** los alias O2M (`phones`/`emails`/`social_links`/`location`) y el campo nativo del correo receptor (ahora se gestiona en el gestor). Ejecute también `npm run brand` para aplicar el Custom CSS que oculta el Guardar global en esta pantalla. Reinicie Directus tras compilar para que cargue la extensión (Settings → Extensions) y para releer la CSP.

### Verificación

`npm run build` de `company-info-manager` compila; `company-profile` es ESM plano sin script de build y se valida con `node --check index.js`. El camino **Items API → Hook → NestJS → Domain → Directus → MySQL** que usa el gestor ya fue **verificado E2E en una iteración previa** (12 casos: teléfono/correo/red/ubicación válidos, inválidos y duplicados, con `company_profile_id` fijado por el backend). Lo que **queda pendiente de verificación en navegador** (headless, sin instancia): el render de la interfaz, el guardado con un solo click desde el drawer, el mapeo inline de errores y el responsive. Pasos manuales abajo. No se afirma "funciona en Directus" a partir de solo tests unitarios.

### Prueba manual (con MySQL + NestJS + Directus reales)

1. Backend: `cd backend; npm run start`. Directus: compile `company-info-manager`, compruebe el Hook ESM, ejecute `npm run start`, `npm run seed:profile` (singleton) y `npm run configure:ui`. Configure `CMS_INTERNAL_TOKEN`/`BACKEND_INTERNAL_TOKEN` iguales y las 2 variables CSP.
2. Abra "Información General". En **Teléfonos → Crear nuevo**: `04141234567` → Guardar → error inline "…comenzando con '+'", drawer abierto, sin fila nueva en `phone`. Corrija a `+58 412 1234567` → Guardar → aparece en la lista sin "Guardar" global.
3. **Correos**: `aaaa` → mensaje de formato de `ValidadoraCorreo`; válido → persiste canónico.
4. **Redes**: seleccionar Instagram → el select muestra Instagram y `form.network` conserva `"Instagram"`; cambiar a WhatsApp → muestra WhatsApp; elegir Otra → muestra Otra y el campo personalizado; escribir Behance + URL `hola` → el rechazo queda inline y conserva `"__otra__"`, Behance y URL; corregir URL → persiste `Behance`, nunca `Otra`/`__otra__`.
5. **Ubicación**: con la CSP de tiles aplicada y Directus reiniciado, "Agregar" en Ubicación → el mapa muestra **calles reales** (no gris); zoom +/− funciona; buscar "Plaza Altamira Caracas" → resultados → elegir centra el mapa y mueve el marcador; click en el mapa y arrastrar el marcador cambian lat/lon; la Dirección **no** cambia sola. Con un punto seleccionado, Dirección `a` → mensaje inline "La dirección es demasiado corta. Escriba una dirección más completa.", sin INSERT y conservando lat/lon/marcador; dirección válida → persiste. Coordenadas manipuladas fuera de rango vía API → backend rechaza; segunda ubicación → rechazada.
6. **Correo receptor** (su propio botón): escriba `aaaa` → **Guardar correo** → error inline "…no es una dirección de correo válida.", sin persistir; un correo válido → **Guardar correo** → "Guardado." (sin usar el Guardar global). Backend apagado → genérico, no guarda.
6b. **Guardar global**: confirme que en Información General **no** aparece el botón "Guardar" del encabezado, y que en otra colección (p. ej. abrir cualquier otra) **sí** aparece con normalidad.
7. **Eliminar**: en cualquier registro pulse la papelera → aparece la confirmación. **Cancelar** → nada cambia. Repita → **Eliminar** → el registro desaparece de inmediato (sin "Guardar" global). En **Ubicación**, tras eliminar vuelve "Sin ubicación registrada" y reaparece "Crear nuevo". Verifique que eliminar una red (p. ej. Instagram) no afecta a las demás.
8. **Backend apagado**: "Crear nuevo" o Editar (cualquier sección) → "No fue posible procesar la solicitud en este momento.", sin INSERT/UPDATE. Pero **Eliminar** con el backend apagado **sí funciona** (es Directus directo) — demuestra la separación CREATE/UPDATE (requieren backend) vs DELETE (Directus directo).

### Registros legacy y `company_profile_id`

Si en pruebas anteriores el flujo O2M dejó filas inconsistentes, **no** se borran automáticamente. Para inspeccionarlas de forma segura (solo lectura), con el singleton `S` = `SELECT id FROM company_profile LIMIT 1`:

```sql
SELECT 'phone' t, id, company_profile_id FROM phone WHERE company_profile_id IS NULL OR company_profile_id <> (SELECT id FROM company_profile LIMIT 1)
UNION ALL SELECT 'email', id, company_profile_id FROM email WHERE company_profile_id IS NULL OR company_profile_id <> (SELECT id FROM company_profile LIMIT 1)
UNION ALL SELECT 'social_link', id, company_profile_id FROM social_link WHERE company_profile_id IS NULL OR company_profile_id <> (SELECT id FROM company_profile LIMIT 1)
UNION ALL SELECT 'location', company_profile_id, company_profile_id FROM location WHERE company_profile_id IS NULL OR company_profile_id <> (SELECT id FROM company_profile LIMIT 1);
```

Reporte tabla/id/estado y decida una limpieza manual acotada; **no** se ejecuta un DELETE masivo automático y **no** se hace `company_profile_id` nullable (la FK sigue obligatoria).

## Directorios reservados

- `extensions/`: contiene la extensión hook del módulo CompanyProfile (`company-profile/`) y la Custom Interface del gestor de Información General (`company-info-manager/`, compilada — incluye el mapa OSM/Leaflet como componente interno). En la compilada, `node_modules/`+`dist/` no se versionan. La antigua `osm-location-picker/` fue retirada (consolidada en el gestor). Otras extensions se organizan por módulo/función.
- `uploads/`: storage local provisional. Su contenido dinámico se ignora; solo se versiona `.gitkeep`. La persistencia definitiva será parte de la PoC de Hostinger.
- `branding/`: assets y configuración reproducible de la identidad visual (ver abajo).

No se afirma que Directus funcione en Hostinger. La autenticación técnica Directus → NestJS quedó resuelta en ADR-023 (token `Bearer`), pero uploads, redeploys, la ejecución del Hook contra un backend real y la operación de producción siguen sin validarse en ese entorno.

## Branding del login (Cromática Creativa)

Esta fase personaliza la **pantalla de login** y el **branding básico del panel interno** (isotipo + nombre + color + texto oscuro no negro). No rediseña el panel interno a fondo (sidebar, Content, Settings, Data Model…), que se hará en otra tarea.

### Assets versionados

- `branding/favicon/favicon-cc.png` — **isotipo** ("C" de Cromática, fondo transparente). Se usa para el favicon **y** para el logo del proyecto (cabecera del login y del panel).
- `branding/logo/logo-oficial-CC.webp` — lockup vertical completo (isotipo + texto). **No** se usa en el login (como logo pequeño se recorta y duplica el nombre; como `public_foreground` provocaba un logo grande flotando). Se conserva por si se necesita en otro contexto.
- `branding/custom.css` — Custom CSS (campo oficial `directus_settings.custom_css`).
- `branding/theme-light-overrides.json` — overrides del theme claro (primario + tonos de texto).
- `branding/palette.md` — paleta muestreada del isotipo y color principal.
- `branding/apply-branding.mjs` — script idempotente que aplica todo vía la API REST oficial.

### Mecanismos oficiales usados (sin tocar el core)

Todo el branding vive en **Project Settings** (`directus_settings`, metadata en MySQL), no en `node_modules`. Por eso **sobrevive a `npm install`, rebuilds y reinicios**: reside en la base de datos.

| Objetivo | Setting oficial |
| --- | --- |
| Nombre de producto / título de pestaña (quita "Directus") | `project_name = "Cromática Creativa"` |
| Quitar el subtítulo "Application" del login | `project_descriptor = ""` (+ CSS que oculta el subtítulo) |
| Logo del proyecto (login y panel; reemplaza el conejo de Directus) | `project_logo` = **isotipo** |
| **Favicon del navegador** | `public_favicon` = **isotipo** (⚠️ en Directus 12.3.0 el campo es `public_favicon`, **no** `project_favicon`; con el campo equivocado Directus mostraba un círculo morado generado desde `project_color`) |
| Sin logo grande flotando en el login | `public_foreground = null` |
| Color principal (botones, focus, enlaces) y tinte del fondo animado | `project_color = #7C3AED` + `theme_light_overrides` |
| Texto oscuro elegante (no negro puro) | `theme_light_overrides.foreground/foregroundAccent/foregroundSubdued` (+ variables en `custom.css`) |
| Fondo claro | `default_appearance = "light"` (+ `custom.css`) |
| Isotipo sin caja morada (login y panel) | `custom_css` neutraliza el fondo `--project-color` de `.public-view .logo` y `.module-bar-logo` |

La **animación de fondo** del login se **conserva**: es un shader WebGL del core (`@directus/app/.../shader-background-*.js`) que solo lee `--project-color`, por lo que adopta el violeta de Cromática. No se reemplaza (`public_background = null`). Un fondo multicolor no es posible por vías soportadas (el shader es del core).

El encabezado del login se amplía de forma moderada y acotada a `.public-view`: el contenedor del isotipo pasa de `50×50 px` a `58×58 px`, la imagen visible de `36×36 px` a `44×44 px` y el nombre de `14 px` a `16 px`. Bajo `640 px`, se ajustan a `52×52 px`, imagen de `40×40 px` y texto de `15 px`, respectivamente, con separación de `12 px`; no afecta al isotipo de la barra lateral ni a otras pantallas.

### Aplicar el branding (local y Hostinger)

Requisito: Directus en ejecución (tras `npm run bootstrap` + `npm run start`), `DIRECTUS_CONFIG_TOKEN` con acceso de Administrador y `DIRECTUS_URL`/`PUBLIC_URL` en el entorno o en `.env`.

```powershell
cd infrastructure/CMS/Directus
npm run brand
```

El script `npm run brand`:

1. usa directamente `DIRECTUS_CONFIG_TOKEN` como credencial Bearer, sin llamar a `/auth/login`;
2. sube el **isotipo** a `directus_files` (idempotente: lo busca por título "Cromática Creativa — Isotipo" antes de subir);
3. aplica `PATCH /settings` con `project_name`, `project_descriptor=""`, `project_color`, `project_logo`, `public_favicon`, `public_foreground=null`, `public_background=null`, `default_appearance=light`, `custom_css` y (best-effort) `theme_light_overrides`.

Es **idempotente**: puede reejecutarse tras cada despliegue. En Hostinger, tras el primer `bootstrap`, ejecutar `npm run brand` una vez (o en el pipeline de deploy) deja el branding aplicado; como vive en la base de datos, persiste en reinicios y redeploys sin repetir cambios manuales. Alternativamente, todos los valores pueden fijarse a mano en Settings → Project Settings/Appearance pegando `branding/custom.css` en "Custom CSS".

### Verificar el favicon (caché del navegador)

El favicon es especialmente cacheado por los navegadores. Tras `npm run brand`, `public_favicon` apunta a `/assets/<id>` (una URL nueva por cada subida del archivo, lo que ya invalida la caché). Si el navegador sigue mostrando el ícono anterior:

1. **Hard refresh** en `/admin/login` (Ctrl+F5).
2. Abrir directamente `http://<host>:8055/assets/<id-del-isotipo>` y confirmar que carga la "C" de Cromática.
3. Probar en una **ventana de incógnito** o pestaña nueva.
4. Si persiste, limpiar la caché del sitio (DevTools → Application → Clear storage), ya que el favicon puede quedar cacheado a nivel de origen.

### Idioma del login (español)

Los textos de las vistas públicas de autenticación (login y reset-password) se muestran en **español** usando el **mecanismo oficial** de Directus: la traducción incorporada `es-ES` seleccionada mediante el setting `default_language`. No se editan locales ni bundles; no hay "traducción falsa" por CSS.

- Setting aplicado por `npm run brand`: `default_language = "es-ES"`.
- Se usa `es-ES` (traducción **completa**) en lugar de `es-419` (parcial: dejaría textos en inglés por fallback).
- Es reproducible y persistente: vive en `directus_settings` (MySQL); en Hostinger basta reejecutar `npm run brand` tras el bootstrap. Alternativa manual: Settings → Project Settings → "Default Language" = Español (España).
- Cada usuario puede fijar su propio idioma en su perfil; `default_language` solo define el idioma por defecto (incluidas las páginas públicas).

Textos verificados en vivo en español: `Iniciar Sesión`, `Correo electrónico`, `Contraseña`, `He olvidado mi Contraseña`, `Restablecer Contraseña`, `Restablecer`, `Continuar`, `Cerrar Sesión`, `No Autenticado`, `Sesión expirada`. El mensaje de confirmación tras solicitar el restablecimiento y demás cadenas del flujo usan la misma traducción `es-ES`.

**Limitación:** el **título de la pestaña** del navegador (p. ej. "Sign In · Cromática Creativa") conserva el nombre de ruta en inglés en la carga pública en frío. Directus fija `document.title` de forma imperativa al navegar, antes de que el locale `es-ES` termine de aplicarse, y no lo recalcula; el **contenido visible de la página sí está en español**. No es corregible por vías soportadas (Directus no expone inyección de JS en páginas públicas, solo `custom_css`; editar el core está prohibido).

### Restricciones (importante)

- **"Powered by Directus" no se oculta.** En Directus 12.3.0 su visibilidad depende de un *entitlement* de licencia (`license.entitlements.display_powered_by`). Ocultarlo sin una licencia válida sería **evadir la funcionalidad de licencia**, algo que la licencia MSCL-1.0-GPL de Directus prohíbe. Se deja intacto de forma deliberada; requeriría una licencia comercial de Directus.
- **La animación no puede ser multicolor por vías soportadas.** El shader del core solo admite `--project-color` (un tono). Cambiar su paleta exigiría modificar el core (prohibido). Se conserva la animación teñida al color de Cromática.

### Prohibido (no hacer)

No editar `node_modules/`, `@directus/*`, bundles compilados ni parchear el core; no hacer fork. Toda la personalización es configuración/assets versionados y reproducibles.
