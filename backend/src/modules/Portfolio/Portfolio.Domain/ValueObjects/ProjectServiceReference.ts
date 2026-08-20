import { UuidValueObject } from './Base/UuidValueObject';

export class ProjectServiceReference extends UuidValueObject {
  public constructor(value: string) { super(value, 'La referencia al servicio del proyecto'); }
}
