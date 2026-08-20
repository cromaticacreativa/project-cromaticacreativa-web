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
import { AgregarUbicacionCommand } from './AgregarUbicacionCommand';

@CommandHandler(AgregarUbicacionCommand)
export class AgregarUbicacionCommandHandler
implements ICommandHandler<AgregarUbicacionCommand, IResultadoUbicacion> {
  public constructor(
    @Inject(COMPANY_PROFILE_STATE_READER) private readonly estado: ICompanyProfileStateReader,
  ) {}

  public async execute(command: AgregarUbicacionCommand): Promise<IResultadoUbicacion> {
    const informacion = await this.estado.leerInformacionDeContacto();
    if (!informacion) {
      throw new UbicacionRechazadaException(
        'La información de contacto de la empresa aún no ha sido inicializada.',
      );
    }
    if (informacion.location !== null) {
      throw UbicacionRechazadaException.conflicto('Ya existe una ubicación registrada.');
    }

    // Se validan dirección, latitud y longitud de forma independiente para
    // acumular todos los errores de la misma operación (§13). Cada rango/regla
    // proviene del Domain (Address / GeoCoordinates); no se duplica aquí. Las
    // coordenadas se sondean por separado para distinguir latitud de longitud.
    const errores: IValidationError[] = [];
    for (const error of [
      UbicacionRechazadaException.capturarCampo('direccion', () => new Address(command.direccion)),
      UbicacionRechazadaException.capturarCampo('latitud', () => new GeoCoordinates(command.latitud, 0)),
      UbicacionRechazadaException.capturarCampo('longitud', () => new GeoCoordinates(0, command.longitud)),
    ]) {
      if (error) errores.push(error);
    }
    if (errores.length > 0) {
      throw UbicacionRechazadaException.acumulada(errores);
    }

    const ubicacion = new CompanyLocation(
      new Address(command.direccion),
      new GeoCoordinates(command.latitud, command.longitud),
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
