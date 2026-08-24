import { ScalarValueObject } from './Base/ScalarValueObject';
import { InvalidValueObjectException } from '../Exceptions/InvalidValueObjectException';

const LONGITUD_MINIMA = 10;
const LONGITUD_MAXIMA = 500;

export class Address extends ScalarValueObject<string> {
  public constructor(value: unknown) {
    if (value === null || value === undefined || typeof value !== 'string') {
      throw new InvalidValueObjectException('La dirección es obligatoria.');
    }
    const normalized = value.trim();
    if (!normalized) throw new InvalidValueObjectException('La dirección no puede estar vacía.');
    if (normalized.length < LONGITUD_MINIMA) {
      throw new InvalidValueObjectException(
        'La dirección es demasiado corta. Escriba una dirección más completa.',
      );
    }
    if (normalized.length > LONGITUD_MAXIMA) {
      throw new InvalidValueObjectException('La dirección supera la longitud máxima permitida.');
    }
    super(normalized);
  }
}
