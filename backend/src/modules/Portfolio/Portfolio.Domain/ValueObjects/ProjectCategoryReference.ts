import { UuidValueObject } from './Base/UuidValueObject';

export class ProjectCategoryReference extends UuidValueObject {
  public constructor(value: string) { super(value, 'La referencia a la categoría del proyecto'); }
}
