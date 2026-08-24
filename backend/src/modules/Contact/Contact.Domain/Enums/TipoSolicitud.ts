import { TipoSolicitudInvalidoException } from '../Exceptions/TipoSolicitudInvalidoException';

export enum TipoSolicitud {
  SolicitudInformacion = 'SOLICITUD_INFORMACION',
  SolicitudServicio = 'SOLICITUD_SERVICIO',
}

export function assertTipoSolicitud(value: TipoSolicitud): void {
  if (!Object.values(TipoSolicitud).includes(value)) {
    throw new TipoSolicitudInvalidoException(String(value));
  }
}
