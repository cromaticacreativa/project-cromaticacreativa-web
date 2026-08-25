import type { CompanyProfileControllers } from './controller';
import { HttpCtx } from './httpErrors';
import { ACTIONS } from './permissions';

type Handler = (ctx: HttpCtx) => unknown;
type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * Router administrativo (`type: 'admin'`) para CompanyProfile. Toda ruta exige un
 * administrador de Strapi autenticado (`admin::isAuthenticatedAdmin`) y, además, el
 * permiso RBAC específico de la operación (`admin::hasPermissions`). La seguridad
 * es de SERVIDOR: un admin sin el permiso recibe 403 aunque conozca la URL. No usa
 * `CMS_INTERNAL_TOKEN` para autenticar al navegador.
 *
 * GET/DELETE: Strapi → MySQL directo. CREATE/UPDATE: Strapi → NestJS → Strapi → MySQL.
 */
export function buildRoutes(c: CompanyProfileControllers) {
  const route = (method: Method, path: string, handler: Handler, action: string) => ({
    method,
    path,
    handler,
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        { name: 'admin::hasPermissions', config: { actions: [action] } },
      ],
    },
    info: { pluginName: 'admin', type: 'admin' as const },
  });

  return {
    type: 'admin' as const,
    routes: [
      route('GET', '/company-profile/informacion-general', c.getInformacionGeneral, ACTIONS.read),
      route('GET', '/company-profile/geocode', c.geocode, ACTIONS.read),

      route('POST', '/company-profile/initialize', c.initialize, ACTIONS.create),
      route('POST', '/company-profile/phones', c.addPhone, ACTIONS.create),
      route('POST', '/company-profile/emails', c.addEmail, ACTIONS.create),
      route('POST', '/company-profile/social-links', c.addSocialLink, ACTIONS.create),
      route('POST', '/company-profile/location', c.addLocation, ACTIONS.create),

      route('PUT', '/company-profile/recipient-email', c.setRecipientEmail, ACTIONS.update),
      route('PUT', '/company-profile/phones/:id', c.updatePhone, ACTIONS.update),
      route('PUT', '/company-profile/emails/:id', c.updateEmail, ACTIONS.update),
      route('PUT', '/company-profile/social-links/:id', c.updateSocialLink, ACTIONS.update),
      route('PUT', '/company-profile/location', c.updateLocation, ACTIONS.update),

      route('DELETE', '/company-profile/phones/:id', c.deletePhone, ACTIONS.delete),
      route('DELETE', '/company-profile/emails/:id', c.deleteEmail, ACTIONS.delete),
      route('DELETE', '/company-profile/social-links/:id', c.deleteSocialLink, ACTIONS.delete),
      route('DELETE', '/company-profile/location', c.deleteLocation, ACTIONS.delete),
    ],
  };
}
