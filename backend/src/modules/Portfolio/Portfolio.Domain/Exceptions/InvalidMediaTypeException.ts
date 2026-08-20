export class InvalidMediaTypeException extends Error {
  public constructor(value: string) {
    super(`El tipo de medio '${value}' no es válido.`);
    this.name = 'InvalidMediaTypeException';
  }
}
