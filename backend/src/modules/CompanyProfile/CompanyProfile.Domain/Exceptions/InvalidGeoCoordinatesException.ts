export class InvalidGeoCoordinatesException extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'InvalidGeoCoordinatesException';
  }
}
