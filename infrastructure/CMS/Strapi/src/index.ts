import type { Core } from '@strapi/strapi';
import { registerCompanyProfile, registerCompanyProfilePermissions } from './company-profile/register';

export default {
  /**
   * Se ejecuta antes de inicializar la aplicación. Registra las rutas admin
   * server-side de CompanyProfile (Información General).
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    registerCompanyProfile(strapi);
  },

  /**
   * Se ejecuta antes de arrancar. Registra (best-effort) las acciones de permiso
   * admin de CompanyProfile para roles limitados futuros.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await registerCompanyProfilePermissions(strapi);
  },
};
