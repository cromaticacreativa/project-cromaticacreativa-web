export class TipoSolicitudInvalidoException extends Error {
  public constructor(value: string) {
    super(`El tipo de solicitud '${value}' no es válido.`);
    this.name = 'TipoSolicitudInvalidoException';
  }
}
