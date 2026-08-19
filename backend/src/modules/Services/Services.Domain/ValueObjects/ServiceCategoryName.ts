import { ScalarValueObject } from './Base/ScalarValueObject';
import { InvalidValueObjectException } from '../Exceptions/InvalidValueObjectException';

export class ServiceCategoryName extends ScalarValueObject<string> {
  public constructor(value: string) {
    const normalized = typeof value === 'string' ? value.trim() : '';
    if (!normalized) throw new InvalidValueObjectException('El nombre de la categoría de servicio no puede estar vacío.');
    super(normalized);
  }
}
