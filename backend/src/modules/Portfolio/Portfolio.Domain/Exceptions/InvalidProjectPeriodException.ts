export class InvalidProjectPeriodException extends Error {
  public constructor(startDate: string, endDate: string) {
    super(`La fecha final '${endDate}' del proyecto no puede ser anterior a la fecha inicial '${startDate}'.`);
    this.name = 'InvalidProjectPeriodException';
  }
}
