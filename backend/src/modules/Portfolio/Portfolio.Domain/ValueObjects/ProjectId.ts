import { UuidValueObject } from './Base/UuidValueObject';

export class ProjectId extends UuidValueObject {
  public constructor(value: string) { super(value, 'El identificador del proyecto'); }
}
