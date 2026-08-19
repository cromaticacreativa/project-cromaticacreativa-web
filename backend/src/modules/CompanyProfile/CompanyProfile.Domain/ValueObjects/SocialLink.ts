import { InvalidValueObjectException } from '../Exceptions/InvalidValueObjectException';
import { ExternalUrl } from './ExternalUrl';

export class SocialLink {
  public readonly network: string;
  private readonly normalizedNetwork: string;

  public constructor(network: string, public readonly url: ExternalUrl) {
    const normalized = typeof network === 'string' ? network.trim() : '';
    if (!normalized) throw new InvalidValueObjectException('La red social no puede estar vacía.');
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
