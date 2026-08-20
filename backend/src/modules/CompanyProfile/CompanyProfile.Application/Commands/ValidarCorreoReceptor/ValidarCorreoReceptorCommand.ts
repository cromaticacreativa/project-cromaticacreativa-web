/**
 * Valida (y canonicaliza) el correo receptor de solicitudes antes de que Directus
 * lo persista en `company_profile.contact_request_recipient_email`.
 *
 * Es el mecanismo mínimo de HU23 para ESTE campo (no implementa HU23 completa): no
 * lee ni escribe; solo comprueba la validez de negocio del correo mediante el
 * mismo Value Object del aggregate y devuelve su forma canónica. La escritura
 * final la hace Directus (escritor único).
 */
export class ValidarCorreoReceptorCommand {
  public constructor(public readonly correo: unknown) {}
}
