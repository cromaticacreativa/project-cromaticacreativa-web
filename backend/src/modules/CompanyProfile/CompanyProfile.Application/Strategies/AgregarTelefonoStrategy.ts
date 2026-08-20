import { Injectable } from '@nestjs/common';
import { CompanyContactInformation } from '../../CompanyProfile.Domain/Aggregates/CompanyContactInformation';
import { InformacionDeContactoRechazadaException } from '../Exceptions/InformacionDeContactoRechazadaException';
import { IAgregarInformacionDeContactoStrategy } from '../Ports/IAgregarInformacionDeContactoStrategy';
import { IEntradaInformacionDeContacto } from '../Ports/IEntradaInformacionDeContacto';
import { IResultadoInformacionDeContacto } from '../Ports/IResultadoInformacionDeContacto';
import { ValidadoraTelefono } from '../Validations/ValidadoraTelefono';

export const TIPO_TELEFONO = 'TELEFONO';

@Injectable()
export class AgregarTelefonoStrategy implements IAgregarInformacionDeContactoStrategy {
  public constructor(private readonly validadoraTelefono: ValidadoraTelefono) {}

  public soporta(entrada: IEntradaInformacionDeContacto): boolean {
    return entrada.tipo === TIPO_TELEFONO;
  }

  public ejecutar(
    informacion: CompanyContactInformation,
    entrada: IEntradaInformacionDeContacto,
  ): IResultadoInformacionDeContacto {
    if (!this.soporta(entrada)) {
      throw new Error(`AgregarTelefonoStrategy solo procesa entradas de tipo '${TIPO_TELEFONO}'.`);
    }
    const telefono = this.validadoraTelefono.validar(entrada.datos['numero']);
    const displayOrder = informacion.phones.length;
    if (!informacion.addPhone(telefono)) {
      throw InformacionDeContactoRechazadaException.conflicto('numero', 'Este número de teléfono ya está registrado.');
    }
    return {
      tipo: TIPO_TELEFONO,
      companyProfileId: informacion.id.value,
      displayOrder,
      datos: { numero: telefono.value },
    };
  }
}
