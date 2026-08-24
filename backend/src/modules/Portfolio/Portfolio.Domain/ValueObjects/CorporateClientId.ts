import { UuidValueObject } from './Base/UuidValueObject';

export class CorporateClientId extends UuidValueObject {
  public constructor(value: string) { super(value, 'El identificador del cliente corporativo'); }
}
