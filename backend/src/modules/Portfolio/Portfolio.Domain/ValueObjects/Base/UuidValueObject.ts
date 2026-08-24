import { InvalidValueObjectException } from '../../Exceptions/InvalidValueObjectException';
import { ScalarValueObject } from './ScalarValueObject';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMPTY_UUID = '00000000-0000-0000-0000-000000000000';

export abstract class UuidValueObject extends ScalarValueObject<string> {
  protected constructor(value: string, concept: string) {
    const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
    if (!UUID_PATTERN.test(normalized) || normalized === EMPTY_UUID) {
      throw new InvalidValueObjectException(`${concept} debe ser un UUID válido y distinto del UUID vacío.`);
    }
    super(normalized);
  }
}
