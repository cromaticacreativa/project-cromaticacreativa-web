import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

/**
 * Custom Interface "Gestor de Información General".
 *
 * Campo de presentación (alias, no persiste) montado en el singleton
 * `company_profile`. Reemplaza los alias O2M nativos para la CREACIÓN de children:
 * cada "Crear nuevo" ejecuta una mutación TOP-LEVEL con la Items API de Directus
 * (`POST /items/phone|email|social_link|location`) usando la sesión autenticada
 * (no expone ningún token). Eso dispara el Filter Hook correspondiente
 * (`<coll>.items.create`) → NestJS valida → payload canónico → Directus inserta.
 *
 * Ventajas frente al O2M nativo: (1) el child persiste al pulsar Guardar una sola
 * vez (sin el "Guardar" global); (2) `company_profile_id` lo fija el backend en el
 * payload canónico (no llega nulo); (3) los errores del backend se leen del array
 * `errors[]` de la respuesta y se muestran inline por campo con el mensaje real
 * (evita `validationError.undefined`). El backend sigue siendo la autoridad.
 */
export default defineInterface({
  id: 'company-info-manager',
  name: 'Gestor de Información General',
  icon: 'contact_page',
  description: 'Crea teléfonos, correos, redes y ubicación con guardado inmediato y errores claros. La validación final es del backend.',
  component: InterfaceComponent,
  types: ['alias'],
  localTypes: ['presentation'],
  group: 'presentation',
  options: [],
});
