import { Address } from './Address';
import { GeoCoordinates } from './GeoCoordinates';

export class CompanyLocation {
  public constructor(
    public readonly address: Address,
    public readonly coordinates: GeoCoordinates,
  ) {}

  public equals(other: unknown): boolean {
    return other instanceof CompanyLocation
      && other.address.equals(this.address)
      && other.coordinates.equals(this.coordinates);
  }
}
