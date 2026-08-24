import { InvalidValueObjectException } from '../Exceptions/InvalidValueObjectException';
import { ExternalUrl } from './ExternalUrl';

const LONGITUD_MAXIMA_RED = 100;

export class SocialLink {
  public readonly network: string;
  private readonly normalizedNetwork: string;

  public constructor(network: unknown, public readonly url: ExternalUrl) {
    if (network === null || network === undefined || typeof network !== 'string') {
      throw new InvalidValueObjectException('El nombre de la red social es obligatorio.');
    }
    const normalized = network.trim();
    if (!normalized) throw new InvalidValueObjectException('La red social no puede estar vacía.');
    if (normalized.length > LONGITUD_MAXIMA_RED) {
      throw new InvalidValueObjectException(`El nombre de la red social no puede superar ${LONGITUD_MAXIMA_RED} caracteres.`);
    }
    this.network = normalized;
    this.normalizedNetwork = normalized.toLocaleLowerCase('en-US');
  }

  public hasSameNetwork(other: SocialLink): boolean {
    return other.normalizedNetwork === this.normalizedNetwork;
  }

  public equals(other: unknown): boolean {
    return other instanceof SocialLink && this.hasSameNetwork(other) && other.url.equals(this.url);
  }
}
