/**
 * Payload canónico que el CMS persistirá al crear el singleton `company_profile`:
 * `id` (UUID generado por NestJS), `singleton_key` (siempre 1) y el correo
 * receptor canónico.
 */
export type InicializarCompanyProfileResponseDto = {
  payload: {
    id: string;
    singleton_key: 1;
    contact_request_recipient_email: string;
  };
};
