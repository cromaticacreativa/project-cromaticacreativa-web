/**
 * Acciones RBAC admin de CompanyProfile.
 *
 * `computeActionId` de Strapi arma el id como `admin::<uid>` cuando `pluginName`
 * es `'admin'` (verificado en @strapi/admin domain/action). Como `company-profile`
 * NO es un plugin registrado, `isAPluginName` solo admite `undefined`, `'admin'` o
 * un plugin real; por eso usamos `pluginName: 'admin'` y un `uid` con prefijo de
 * módulo (`company-profile.<op>`). Resultado: `admin::company-profile.read|create|
 * update|delete`.
 */
export const ACTIONS = {
  read: 'admin::company-profile.read',
  create: 'admin::company-profile.create',
  update: 'admin::company-profile.update',
  delete: 'admin::company-profile.delete',
} as const;

/** Definiciones para `actionProvider.registerMany` (sección "plugins", grupo admin). */
export const ACTION_DEFINITIONS = [
  { section: 'plugins', pluginName: 'admin', subCategory: 'Información General', displayName: 'Información General — ver', uid: 'company-profile.read' },
  { section: 'plugins', pluginName: 'admin', subCategory: 'Información General', displayName: 'Información General — crear', uid: 'company-profile.create' },
  { section: 'plugins', pluginName: 'admin', subCategory: 'Información General', displayName: 'Información General — editar', uid: 'company-profile.update' },
  { section: 'plugins', pluginName: 'admin', subCategory: 'Información General', displayName: 'Información General — eliminar', uid: 'company-profile.delete' },
];
