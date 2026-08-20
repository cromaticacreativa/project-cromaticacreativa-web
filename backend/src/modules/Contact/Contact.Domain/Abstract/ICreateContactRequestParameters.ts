import { Client } from '../Entities/Client';
import { TipoSolicitud } from '../Enums/TipoSolicitud';
import { ContactRequestId } from '../ValueObjects/ContactRequestId';
import { RequestedServiceReference } from '../ValueObjects/RequestedServiceReference';

export interface ICreateContactRequestParameters {
  id: ContactRequestId;
  client: Client;
  tipoSolicitud: TipoSolicitud;
  requestedService: RequestedServiceReference;
  message?: string | null;
}
