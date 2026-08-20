# Directus para Cromática Creativa

Aplicación administrativa independiente incorporada para HU09. Usa Directus `12.3.0`, requiere Node.js `>=22` y no forma parte del build de NestJS. Su deployment y la PoC completa en Hostinger Business Web Hosting siguen pendientes.

Fuentes oficiales consultadas:

- [paquete `directus` en npm](https://www.npmjs.com/package/directus);
- [CLI de Directus](https://docs.directus.io/self-hosted/cli);
- [opciones de configuración](https://docs.directus.io/self-hosted/config-options);
- [autenticación](https://docs.directus.io/reference/authentication).

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

## Directorios reservados

- `extensions/`: reservado para extensions futuras; HU09 no incluye Filter Hooks ni otras extensions.
- `uploads/`: storage local provisional. Su contenido dinámico se ignora; solo se versiona `.gitkeep`. La persistencia definitiva será parte de la PoC de Hostinger.

No se afirma que Directus funcione en Hostinger. Tampoco se consideran validados todavía Filter Hooks, la autenticación Directus → NestJS, uploads, redeploys ni la operación de producción.
