import type { Core } from '@strapi/strapi';

/**
 * Strapi se conecta a la MISMA base de datos MySQL/MariaDB que el backend
 * (por ejemplo `cromatica_prod`). Es una sola base física/lógica; NO se crea una
 * segunda base.
 *
 * Compartir la conexión NO significa que Strapi sea dueño de las tablas de
 * negocio: Strapi crea y gobierna únicamente sus **tablas internas propias**
 * (administradores, roles, permisos, configuración, sesiones/tokens). El schema
 * de las tablas de negocio (`company_profile`, `phone`, `email`, `social_link`,
 * `location`, `corporate_client`, `project`, `media`, `service`, `category`) es
 * autoridad exclusiva de las **TypeORM migrations** del backend.
 *
 * Reparto de responsabilidades:
 *  - TypeORM migrations = estructura de las tablas de negocio.
 *  - Strapi            = CMS administrativo + auth + sus tablas internas.
 *  - NestJS            = reglas de negocio (CREATE/UPDATE via Application/Domain).
 *  - MySQL             = NOT NULL, UNIQUE, FK, CHECK, tipos.
 *
 * Las variables `STRAPI_DB_*` son las credenciales del proceso Strapi y DEBEN
 * apuntar a la misma base que `MYSQL_*` del backend (`STRAPI_DB_NAME` =
 * `MYSQL_DATABASE`). Cliente: MySQL/MariaDB. NO se usa SQLite.
 */
const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Database => {
  return {
    connection: {
      client: 'mysql',
      connection: {
        host: env('STRAPI_DB_HOST', '127.0.0.1'),
        port: env.int('STRAPI_DB_PORT', 3306),
        // Debe coincidir con MYSQL_DATABASE del backend (misma base única).
        database: env('STRAPI_DB_NAME', 'cromatica_prod'),
        user: env('STRAPI_DB_USER', 'cromatica_app'),
        password: env('STRAPI_DB_PASSWORD', ''),
        ssl: env.bool('STRAPI_DB_SSL', false) && {
          key: env('STRAPI_DB_SSL_KEY', undefined),
          cert: env('STRAPI_DB_SSL_CERT', undefined),
          ca: env('STRAPI_DB_SSL_CA', undefined),
          capath: env('STRAPI_DB_SSL_CAPATH', undefined),
          cipher: env('STRAPI_DB_SSL_CIPHER', undefined),
          rejectUnauthorized: env.bool('STRAPI_DB_SSL_REJECT_UNAUTHORIZED', true),
        },
      },
      pool: {
        min: env.int('STRAPI_DB_POOL_MIN', 2),
        max: env.int('STRAPI_DB_POOL_MAX', 10),
      },
      acquireConnectionTimeout: env.int('STRAPI_DB_CONNECTION_TIMEOUT', 60000),
    },
  };
};

export default config;
