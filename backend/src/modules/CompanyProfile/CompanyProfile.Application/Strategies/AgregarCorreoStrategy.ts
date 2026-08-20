import { Injectable } from '@nestjs/common';
import { CompanyContactInformation } from '../../CompanyProfile.Domain/Aggregates/CompanyContactInformation';
import { EmailAddress } from '../../CompanyProfile.Domain/ValueObjects/EmailAddress';
import { InformacionDeContactoRechazadaException } from '../Exceptions/InformacionDeContactoRechazadaException';
import { IAgregarInformacionDeContactoStrategy } from '../Ports/IAgregarInformacionDeContactoStrategy';
import { IEntradaInformacionDeContacto } from '../Ports/IEntradaInformacionDeContacto';
import { IResultadoInformacionDeContacto } from '../Ports/IResultadoInformacionDeContacto';

export const TIPO_CORREO = 'CORREO';

@Injectable()
export class AgregarCorreoStrategy implements IAgregarInformacionDeContactoStrategy {
  public soporta(entrada: IEntradaInformacionDeContacto): boolean {
    return entrada.tipo === TIPO_CORREO;
  }

  public ejecutar(
    informacion: CompanyContactInformation,
    entrada: IEntradaInformacionDeContacto,
  ): IResultadoInformacionDeContacto {
    if (!this.soporta(entrada)) {
      throw new Error(`AgregarCorreoStrategy solo procesa entradas de tipo '${TIPO_CORREO}'.`);
    }
    const direccion = InformacionDeContactoRechazadaException.desdeValidezDeDominio(
      'correo',
      () => new EmailAddress(entrada.datos['correo']),
    );
    const displayOrder = informacion.emails.length;
    if (!informacion.addEmail(direccion)) {
      throw InformacionDeContactoRechazadaException.conflicto('correo', 'Este correo electrónico ya está registrado.');
    }
    return {
      tipo: TIPO_CORREO,
      companyProfileId: informacion.id.value,
      displayOrder,
      datos: { correo: direccion.value },
    };
  }
}
