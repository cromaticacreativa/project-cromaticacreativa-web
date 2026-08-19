import { UuidValueObject } from './Base/UuidValueObject';

export class ContactRequestId extends UuidValueObject {
  public constructor(value: string) { super(value, 'El identificador de la solicitud de contacto'); }
}
