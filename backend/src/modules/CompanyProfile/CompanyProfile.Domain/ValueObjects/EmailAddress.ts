import { ScalarValueObject } from './Base/ScalarValueObject';
import { InvalidValueObjectException } from '../Exceptions/InvalidValueObjectException';

const DOMAIN_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;

export class EmailAddress extends ScalarValueObject<string> {
  public constructor(value: string) {
    const normalized = typeof value === 'string' ? value.trim() : '';
    const parts = normalized.split('@');
    const local = parts[0] ?? '';
    const domain = parts[1] ?? '';
    const labels = domain.split('.');
    if (!normalized || normalized.length > 254 || /\s/.test(normalized) || parts.length !== 2
      || !local || local.length > 64 || !domain || labels.some((label) => !DOMAIN_LABEL.test(label))) {
      throw new InvalidValueObjectException('La dirección de correo electrónico no es válida.');
    }
    super(normalized);
  }
}
