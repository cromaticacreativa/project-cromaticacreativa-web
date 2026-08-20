export class InvalidValueObjectException extends Error {
  /**
   * Discriminador opcional del motivo del rechazo (por ejemplo, en un correo:
   * `obligatorio`, `vacio`, `longitud`, `formato`, `dominio`, `tld`). Permite que
   * Application traduzca a mensajes específicos sin re-inspeccionar el texto. El
   * mensaje visible sigue siendo la autoridad; `reason` es solo metadata interna.
   */
  public readonly reason?: string;

  public constructor(message: string, reason?: string) {
    super(message);
    this.name = 'InvalidValueObjectException';
    this.reason = reason;
  }
}
