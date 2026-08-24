import { UuidValueObject } from './Base/UuidValueObject';

export class CompanyContactInformationId extends UuidValueObject {
  public constructor(value: string) { super(value, 'El identificador de la información de contacto'); }
}
