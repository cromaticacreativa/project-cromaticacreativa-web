export class InvalidValueObjectException extends Error {
  public constructor(message: string) { super(message); this.name = 'InvalidValueObjectException'; }
}
