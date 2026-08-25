import type { StrapiApp } from '@strapi/strapi/admin';
import { Cog } from '@strapi/icons';
import favicon from './extensions/favicon.png';
import logo from './extensions/logo.webp';

// Paleta oficial (assets/branding/palette.md): primario violeta #7C3AED, hover #6D28D9.
const PRIMARY = '#7C3AED';
const PRIMARY_HOVER = '#6D28D9';
const PRIMARY_LIGHT = '#EDE9FE';

const purpleScale = {
  100: '#F5F3FF',
  200: PRIMARY_LIGHT,
  500: '#8B5CF6',
  600: PRIMARY,
  700: PRIMARY_HOVER,
};

export default {
  config: {
    locales: ['es'],
    auth: { logo },
    menu: { logo },
    head: { favicon, title: 'Cromática Creativa' },
    theme: {
      light: { colors: { primary100: purpleScale[100], primary200: purpleScale[200], primary500: purpleScale[500], primary600: purpleScale[600], primary700: purpleScale[700], buttonPrimary500: purpleScale[600], buttonPrimary600: purpleScale[700] } },
      dark: { colors: { primary100: '#241C3A', primary200: '#2A2050', primary500: purpleScale[500], primary600: purpleScale[600], primary700: purpleScale[700], buttonPrimary500: purpleScale[600], buttonPrimary600: purpleScale[700] } },
    },
    translations: {
      es: {
        'app.components.LeftMenu.navbrand.title': 'Cromática Creativa',
        'app.components.LeftMenu.navbrand.workplace': 'Panel administrativo',
        'Auth.form.welcome.title': 'Cromática Creativa',
        'Auth.form.welcome.subtitle': 'Panel administrativo',
        'cromatica.informacion-general': 'Información General',
      },
    },
    tutorials: false,
    notifications: { releases: false },
  },

  bootstrap(app: StrapiApp) {
    app.addMenuLink({
      to: '/company-profile',
      icon: Cog,
      intlLabel: { id: 'cromatica.informacion-general', defaultMessage: 'Información General' },
      // El menú solo aparece para admins con permiso de lectura (además del guard de servidor).
      permissions: [{ action: 'admin::company-profile.read', subject: null }],
      Component: () => import('./pages/InformacionGeneral'),
    });
  },
};
