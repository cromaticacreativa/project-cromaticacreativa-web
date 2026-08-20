import { UuidValueObject } from './Base/UuidValueObject';

export class ProjectMediaId extends UuidValueObject {
  public constructor(value: string) { super(value, 'El identificador del medio del proyecto'); }
}
