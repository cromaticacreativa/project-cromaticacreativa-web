import { InvalidGeoCoordinatesException } from '../Exceptions/InvalidGeoCoordinatesException';

export class GeoCoordinates {
  public constructor(public readonly latitude: number, public readonly longitude: number) {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
      || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new InvalidGeoCoordinatesException(latitude, longitude);
    }
  }
  public equals(other: unknown): boolean {
    return other instanceof GeoCoordinates && other.latitude === this.latitude && other.longitude === this.longitude;
  }
}
