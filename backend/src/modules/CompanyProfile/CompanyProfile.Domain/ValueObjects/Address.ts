import { ScalarValueObject } from './Base/ScalarValueObject';
import { InvalidValueObjectException } from '../Exceptions/InvalidValueObjectException';

export class Address extends ScalarValueObject<string> {
  public constructor(value: string) {
    const normalized = typeof value === 'string' ? value.trim() : '';
    if (!normalized) throw new InvalidValueObjectException('La dirección no puede estar vacía.');
    super(normalized);
  }
}
