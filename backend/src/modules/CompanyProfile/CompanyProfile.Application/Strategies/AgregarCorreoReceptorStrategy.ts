import { Injectable } from '@nestjs/common';
import { CompanyContactInformation } from '../../CompanyProfile.Domain/Aggregates/CompanyContactInformation';
import { IAgregarInformacionDeContactoStrategy } from '../Ports/IAgregarInformacionDeContactoStrategy';
import { IEntradaInformacionDeContacto } from '../Ports/IEntradaInformacionDeContacto';
import { IResultadoCorreoReceptor } from '../Ports/IResultadoInformacionDeContacto';
import { ValidadoraCorreo } from '../Validations/ValidadoraCorreo';

export const TIPO_CORREO_RECEPTOR = 'CORREO_RECEPTOR' as const;

@Injectable()
export class AgregarCorreoReceptorStrategy
implements IAgregarInformacionDeContactoStrategy<IResultadoCorreoReceptor> {
  public constructor(private readonly validadoraCorreo: ValidadoraCorreo) {}

  public soporta(entrada: IEntradaInformacionDeContacto): boolean {
    return entrada.tipo === TIPO_CORREO_RECEPTOR;
  }

  public ejecutar(
    informacion: CompanyContactInformation,
    entrada: IEntradaInformacionDeContacto,
  ): IResultadoCorreoReceptor {
    if (!this.soporta(entrada)) {
      throw new Error(
        `AgregarCorreoReceptorStrategy solo procesa entradas de tipo '${TIPO_CORREO_RECEPTOR}'.`,
      );
    }
    const correo = this.validadoraCorreo.validar(entrada.datos['correo']);
    informacion.changeContactRequestRecipientEmail(correo);
    return {
      tipo: TIPO_CORREO_RECEPTOR,
      datos: { correo: correo.value },
    };
  }
}
