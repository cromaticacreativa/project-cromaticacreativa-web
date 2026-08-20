import { ScalarValueObject } from './Base/ScalarValueObject';
import { InvalidValueObjectException } from '../Exceptions/InvalidValueObjectException';

const LONGITUD_MAXIMA = 500;

export class Address extends ScalarValueObject<string> {
  public constructor(value: unknown) {
    if (value === null || value === undefined || typeof value !== 'string') {
      throw new InvalidValueObjectException('La dirección es obligatoria.');
    }
    const normalized = value.trim();
    if (!normalized) throw new InvalidValueObjectException('La dirección no puede estar vacía.');
    if (normalized.length > LONGITUD_MAXIMA) {
      throw new InvalidValueObjectException(`La dirección no puede superar ${LONGITUD_MAXIMA} caracteres.`);
    }
    super(normalized);
  }
}
