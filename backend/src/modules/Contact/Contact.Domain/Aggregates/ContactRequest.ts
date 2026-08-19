import { ICreateContactRequestParameters } from '../Abstract/ICreateContactRequestParameters';
import { Client } from '../Entities/Client';
import { assertTipoSolicitud, TipoSolicitud } from '../Enums/TipoSolicitud';
import { ContactRequestId } from '../ValueObjects/ContactRequestId';
import { RequestedServiceReference } from '../ValueObjects/RequestedServiceReference';

function normalizeOptional(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value.trim().length === 0) return null;
  return value.trim();
}

export class ContactRequest {
  private constructor(
    public readonly id: ContactRequestId,
    public readonly client: Client,
    public readonly tipoSolicitud: TipoSolicitud,
    public readonly requestedService: RequestedServiceReference,
    public readonly message: string | null,
  ) {}

  public static create(input: ICreateContactRequestParameters): ContactRequest {
    assertTipoSolicitud(input.tipoSolicitud);
    return new ContactRequest(input.id, input.client, input.tipoSolicitud,
      input.requestedService, normalizeOptional(input.message));
  }
}
