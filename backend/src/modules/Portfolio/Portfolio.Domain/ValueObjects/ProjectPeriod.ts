import { InvalidProjectPeriodException } from '../Exceptions/InvalidProjectPeriodException';
import { CalendarDate } from './CalendarDate';

export class ProjectPeriod {
  public constructor(public readonly startDate: CalendarDate, public readonly endDate: CalendarDate) {
    if (endDate.compareTo(startDate) < 0) {
      throw new InvalidProjectPeriodException(startDate.value, endDate.value);
    }
  }

  public get totalDays(): number { return this.startDate.daysUntil(this.endDate); }

  public equals(other: unknown): boolean {
    return other instanceof ProjectPeriod
      && this.startDate.equals(other.startDate)
      && this.endDate.equals(other.endDate);
  }
}
