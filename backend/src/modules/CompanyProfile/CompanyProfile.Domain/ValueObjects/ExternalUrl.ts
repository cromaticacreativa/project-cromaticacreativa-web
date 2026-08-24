import { ScalarValueObject } from './Base/ScalarValueObject';
import { InvalidValueObjectException } from '../Exceptions/InvalidValueObjectException';

const LONGITUD_MAXIMA = 2048;

export class ExternalUrl extends ScalarValueObject<string> {
  public constructor(value: unknown) {
    if (value === null || value === undefined || typeof value !== 'string') {
      throw new InvalidValueObjectException('La URL es obligatoria.');
    }
    const normalized = value.trim();
    if (!normalized) throw new InvalidValueObjectException('La URL no puede estar vacía.');
    if (normalized.length > LONGITUD_MAXIMA) {
      throw new InvalidValueObjectException(`La URL no puede superar ${LONGITUD_MAXIMA} caracteres.`);
    }
    let parsed: URL;
    try { parsed = new URL(normalized); }
    catch { throw new InvalidValueObjectException('La URL debe ser una URL HTTP o HTTPS válida.'); }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new InvalidValueObjectException('La URL debe ser una URL HTTP o HTTPS válida.');
    }
    super(normalized);
  }
}
