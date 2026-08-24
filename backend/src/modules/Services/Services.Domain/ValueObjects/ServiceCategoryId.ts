import { UuidValueObject } from './Base/UuidValueObject';

export class ServiceCategoryId extends UuidValueObject {
  public constructor(value: string) { super(value, 'El identificador de la categoría de servicio'); }
}
