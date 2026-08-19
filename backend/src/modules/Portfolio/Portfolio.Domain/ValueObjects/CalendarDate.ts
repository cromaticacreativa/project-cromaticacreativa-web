import { ScalarValueObject } from './Base/ScalarValueObject';
import { InvalidValueObjectException } from '../Exceptions/InvalidValueObjectException';

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MILLISECONDS_PER_DAY = 86_400_000;

export class CalendarDate extends ScalarValueObject<string> {
  private readonly epochDay: number;

  public constructor(value: string) {
    const match = DATE_PATTERN.exec(value);
    if (!match) {
      throw new InvalidValueObjectException('La fecha debe utilizar el formato YYYY-MM-DD.');
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (year < 1) throw new InvalidValueObjectException(`La fecha '${value}' no es válida.`);

    const date = new Date(0);
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCFullYear(year, month - 1, day);
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
      throw new InvalidValueObjectException(`La fecha '${value}' no es válida.`);
    }

    super(value);
    this.epochDay = date.getTime() / MILLISECONDS_PER_DAY;
  }

  public compareTo(other: CalendarDate): number { return this.epochDay - other.epochDay; }
  public daysUntil(other: CalendarDate): number { return other.epochDay - this.epochDay; }
}
