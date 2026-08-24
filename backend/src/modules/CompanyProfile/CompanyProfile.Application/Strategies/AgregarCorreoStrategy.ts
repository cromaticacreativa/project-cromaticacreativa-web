import { Injectable } from '@nestjs/common';
import { CompanyContactInformation } from '../../CompanyProfile.Domain/Aggregates/CompanyContactInformation';
import { InformacionDeContactoRechazadaException } from '../Exceptions/InformacionDeContactoRechazadaException';
import { IAgregarInformacionDeContactoStrategy } from '../Ports/IAgregarInformacionDeContactoStrategy';
import { IEntradaInformacionDeContacto } from '../Ports/IEntradaInformacionDeContacto';
import { IResultadoInformacionDeContactoOrdenado } from '../Ports/IResultadoInformacionDeContacto';
import { ValidadoraCorreo } from '../Validations/ValidadoraCorreo';

export const TIPO_CORREO = 'CORREO';

@Injectable()
export class AgregarCorreoStrategy
implements IAgregarInformacionDeContactoStrategy<IResultadoInformacionDeContactoOrdenado<{ correo: string }>> {
  public constructor(private readonly validadoraCorreo: ValidadoraCorreo) {}

  public soporta(entrada: IEntradaInformacionDeContacto): boolean {
    return entrada.tipo === TIPO_CORREO;
  }

  public ejecutar(
    informacion: CompanyContactInformation,
    entrada: IEntradaInformacionDeContacto,
  ): IResultadoInformacionDeContactoOrdenado<{ correo: string }> {
    if (!this.soporta(entrada)) {
      throw new Error(`AgregarCorreoStrategy solo procesa entradas de tipo '${TIPO_CORREO}'.`);
    }
    const direccion = this.validadoraCorreo.validar(entrada.datos['correo']);
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
