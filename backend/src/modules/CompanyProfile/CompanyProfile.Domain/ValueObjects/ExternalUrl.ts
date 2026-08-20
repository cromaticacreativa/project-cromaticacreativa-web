import { ScalarValueObject } from './Base/ScalarValueObject';
import { InvalidValueObjectException } from '../Exceptions/InvalidValueObjectException';

export class ExternalUrl extends ScalarValueObject<string> {
  public constructor(value: string) {
    const normalized = typeof value === 'string' ? value.trim() : '';
    let parsed: URL;
    try { parsed = new URL(normalized); }
    catch { throw new InvalidValueObjectException('La URL externa debe ser una URL HTTP o HTTPS absoluta.'); }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new InvalidValueObjectException('La URL externa debe ser una URL HTTP o HTTPS absoluta.');
    }
    super(normalized);
  }
}
