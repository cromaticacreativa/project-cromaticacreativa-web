import { ScalarValueObject } from './Base/ScalarValueObject';
import { InvalidValueObjectException } from '../Exceptions/InvalidValueObjectException';

export class DisplayOrder extends ScalarValueObject<number> {
  public constructor(value: number) {
    if (!Number.isInteger(value) || value < 0) {
      throw new InvalidValueObjectException('El orden de visualización debe ser un entero no negativo.');
    }
    super(value);
  }
}
