import { ScalarValueObject } from './Base/ScalarValueObject';
import { InvalidValueObjectException } from '../Exceptions/InvalidValueObjectException';

export class PhoneNumber extends ScalarValueObject<string> {
  public constructor(value: string) {
    const normalized = typeof value === 'string' ? value.trim() : '';
    if (!normalized) throw new InvalidValueObjectException('El número de teléfono no puede estar vacío.');
    super(normalized);
  }
}
