/**
 * Resultado canónico de inicializar el singleton `company_profile`.
 *
 * La primera configuración de la empresa crea la fila singleton con su único
 * campo obligatorio (`contact_request_recipient_email`). NestJS valida y
 * canonicaliza el correo y genera el identificador; el CMS (Strapi) ejecuta el
 * `INSERT` final con este payload.
 */
export interface IResultadoInicializacion {
  readonly companyProfileId: string;
  readonly contactRequestRecipientEmail: string;
}
