import { ClientId } from '../ValueObjects/ClientId';
import { EmailAddress } from '../ValueObjects/EmailAddress';
import { PersonName } from '../ValueObjects/PersonName';
import { PhoneNumber } from '../ValueObjects/PhoneNumber';

function normalizeOptional(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value.trim().length === 0) return null;
  return value.trim();
}

export class Client {
  private constructor(
    public readonly id: ClientId,
    public readonly name: PersonName,
    public readonly companyName: string | null,
    public readonly email: EmailAddress,
    public readonly phone: PhoneNumber,
  ) {}

  public static create(
    id: ClientId,
    name: PersonName,
    companyName: string | null | undefined,
    email: EmailAddress,
    phone: PhoneNumber,
  ): Client {
    return new Client(id, name, normalizeOptional(companyName), email, phone);
  }
}
