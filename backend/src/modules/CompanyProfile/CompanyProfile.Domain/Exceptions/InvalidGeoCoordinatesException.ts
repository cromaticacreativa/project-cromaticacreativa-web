export class InvalidGeoCoordinatesException extends Error {
  public constructor(latitude: number, longitude: number) {
    super(`Las coordenadas '${latitude}, ${longitude}' están fuera de los rangos válidos de latitud y longitud.`);
    this.name = 'InvalidGeoCoordinatesException';
  }
}
