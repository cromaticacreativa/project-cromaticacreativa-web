/**
 * Inicializa el singleton `company_profile` cuando todavía no existe.
 *
 * Es el único caso de uso que puede crear el perfil: el resto de los casos de uso
 * administrativos (agregar/modificar teléfono, correo, red social, ubicación y
 * cambiar el correo receptor) exigen que el perfil ya exista. Transporta
 * únicamente el correo receptor crudo; la validación vive en el Handler.
 */
export class InicializarCompanyProfileCommand {
  public constructor(public readonly contactRequestRecipientEmail: unknown) {}
}
