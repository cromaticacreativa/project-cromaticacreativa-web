import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Address } from '../../../CompanyProfile.Domain/ValueObjects/Address';
import { CompanyLocation } from '../../../CompanyProfile.Domain/ValueObjects/CompanyLocation';
import { GeoCoordinates } from '../../../CompanyProfile.Domain/ValueObjects/GeoCoordinates';
import { UbicacionRechazadaException } from '../../Exceptions/UbicacionRechazadaException';
import {
  COMPANY_PROFILE_STATE_READER,
  ICompanyProfileStateReader,
} from '../../Ports/ICompanyProfileStateReader';
import { IResultadoUbicacion } from '../../Ports/IResultadoUbicacion';
import { IValidationError } from '../../Ports/IValidationError';
import { ModificarUbicacionCommand } from './ModificarUbicacionCommand';

/**
 * HU25: modifica la ubicación existente reutilizando exactamente las validaciones
 * de Agregar (Address / GeoCoordinates), acumulando todos los errores. Los campos
 * ausentes en el update parcial se toman del estado actual. No persiste: el CMS
 * externo hace el UPDATE final.
 */
@CommandHandler(ModificarUbicacionCommand)
export class ModificarUbicacionCommandHandler
implements ICommandHandler<ModificarUbicacionCommand, IResultadoUbicacion> {
  public constructor(
    @Inject(COMPANY_PROFILE_STATE_READER) private readonly estado: ICompanyProfileStateReader,
  ) {}

  public async execute(command: ModificarUbicacionCommand): Promise<IResultadoUbicacion> {
    const informacion = await this.estado.leerInformacionDeContacto();
    if (!informacion) {
      throw new UbicacionRechazadaException(
        'La información de contacto de la empresa aún no ha sido inicializada.',
      );
    }
    const actual = informacion.location;
    if (actual === null) {
      throw new UbicacionRechazadaException('No hay una ubicación registrada para modificar.');
    }

    // Completar los campos no enviados con el valor actual (update parcial).
    const direccion = command.direccion !== undefined ? command.direccion : actual.address.value;
    const latitud = command.latitud !== undefined ? command.latitud : actual.coordinates.latitude;
    const longitud = command.longitud !== undefined ? command.longitud : actual.coordinates.longitude;

    const errores: IValidationError[] = [];
    for (const error of [
      UbicacionRechazadaException.capturarCampo('direccion', () => new Address(direccion)),
      UbicacionRechazadaException.capturarCampo('latitud', () => new GeoCoordinates(latitud, 0)),
      UbicacionRechazadaException.capturarCampo('longitud', () => new GeoCoordinates(0, longitud)),
    ]) {
      if (error) errores.push(error);
    }
    if (errores.length > 0) {
      throw UbicacionRechazadaException.acumulada(errores);
    }

    const ubicacion = new CompanyLocation(
      new Address(direccion),
      new GeoCoordinates(latitud, longitud),
    );
    informacion.setLocation(ubicacion);

    return {
      companyProfileId: informacion.id.value,
      direccion: ubicacion.address.value,
      latitud: ubicacion.coordinates.latitude,
      longitud: ubicacion.coordinates.longitude,
    };
  }
}
