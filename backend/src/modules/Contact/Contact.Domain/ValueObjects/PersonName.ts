import { InvalidValueObjectException } from '../Exceptions/InvalidValueObjectException';

export class PersonName {
  public readonly firstName: string;
  public readonly lastName: string;

  public constructor(firstName: string, lastName: string) {
    const normalizedFirstName = typeof firstName === 'string' ? firstName.trim() : '';
    const normalizedLastName = typeof lastName === 'string' ? lastName.trim() : '';
    if (!normalizedFirstName) throw new InvalidValueObjectException('El nombre no puede estar vacío.');
    if (!normalizedLastName) throw new InvalidValueObjectException('El apellido no puede estar vacío.');
    this.firstName = normalizedFirstName;
    this.lastName = normalizedLastName;
  }

  public equals(other: unknown): boolean {
    return other instanceof PersonName
      && other.firstName === this.firstName
      && other.lastName === this.lastName;
  }
}
