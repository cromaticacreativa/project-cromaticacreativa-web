import type { Core } from '@strapi/strapi';
import { createControllers } from './server/controller';
import type { KnexLike } from './server/database';
import { NestInternalClient } from './server/nestClient';
import { ACTION_DEFINITIONS } from './server/permissions';
import { CompanyProfileRepository } from './server/repository';
import { buildRoutes } from './server/routes';
import { CompanyProfileCmsService } from './server/service';

/**
 * Registra las rutas administrativas server-side de CompanyProfile. Se llama en
 * `register()` del ciclo de vida de Strapi. Instancia el repositorio con la
 * conexión Knex interna de Strapi y el cliente NestJS con las variables de
 * entorno (solo servidor).
 */
export function registerCompanyProfile(strapi: Core.Strapi): void {
  const knex = strapi.db.connection as unknown as KnexLike;
  const repository = new CompanyProfileRepository(knex);
  const nest = new NestInternalClient({
    baseUrl: process.env.BACKEND_INTERNAL_URL,
    token: process.env.CMS_INTERNAL_TOKEN,
  });
  const service = new CompanyProfileCmsService(repository, nest);
  const controllers = createControllers(service);
  strapi.server.routes(buildRoutes(controllers));
}

/**
 * Registra las acciones de permiso admin (`plugin::company-profile.read|create|
 * update|delete`) para que el RBAC de las rutas funcione y puedan asignarse a roles
 * limitados. Super Admin ya tiene acceso a todo.
 *
 * Si la API de permisos no está disponible, se registra un **error visible** (no un
 * warning silencioso): sin estas acciones, las rutas con `hasPermissions` niegan a
 * los administradores no Super Admin (fail closed), por lo que no se debe asumir que
 * el RBAC quedó operativo. Super Admin sigue funcionando. No se aborta el arranque
 * para no romper el deploy.
 */
export async function registerCompanyProfilePermissions(strapi: Core.Strapi): Promise<void> {
  const permission = strapi.service('admin::permission') as
    | { actionProvider?: { registerMany?: (actions: unknown[]) => Promise<unknown> } }
    | undefined;
  const registerMany = permission?.actionProvider?.registerMany?.bind(permission.actionProvider);

  if (!registerMany) {
    strapi.log.error(
      '[company-profile] RBAC NO configurado: admin::permission.actionProvider.registerMany no disponible. ' +
        'Las rutas negarán a administradores no Super Admin. Revisar compatibilidad de Strapi.',
    );
    return;
  }

  try {
    await registerMany(ACTION_DEFINITIONS);
    strapi.log.info('[company-profile] Acciones RBAC registradas (read/create/update/delete).');
  } catch (error) {
    strapi.log.error(
      `[company-profile] Falló el registro de acciones RBAC: ${(error as Error)?.message ?? 'error desconocido'}. ` +
        'Las rutas negarán a administradores no Super Admin (fail closed).',
    );
  }
}
