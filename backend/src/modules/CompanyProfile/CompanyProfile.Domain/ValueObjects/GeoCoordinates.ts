import { InvalidGeoCoordinatesException } from '../Exceptions/InvalidGeoCoordinatesException';

export class GeoCoordinates {
  public constructor(public readonly latitude: number, public readonly longitude: number) {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new InvalidGeoCoordinatesException('Las coordenadas deben ser valores numéricos finitos.');
    }
    if (latitude < -90 || latitude > 90) {
      throw new InvalidGeoCoordinatesException('La latitud debe estar entre -90 y 90.');
    }
    if (longitude < -180 || longitude > 180) {
      throw new InvalidGeoCoordinatesException('La longitud debe estar entre -180 y 180.');
    }
  }

  public equals(other: unknown): boolean {
    return other instanceof GeoCoordinates && other.latitude === this.latitude && other.longitude === this.longitude;
  }
}
