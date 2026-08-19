import { UuidValueObject } from './Base/UuidValueObject';

export class ClientId extends UuidValueObject {
  public constructor(value: string) { super(value, 'El identificador del cliente'); }
}
