import { Injectable } from '@nestjs/common';
import { CompanyContactInformation } from '../../CompanyProfile.Domain/Aggregates/CompanyContactInformation';
import { InformacionDeContactoRechazadaException } from '../Exceptions/InformacionDeContactoRechazadaException';
import { IAgregarInformacionDeContactoStrategy } from '../Ports/IAgregarInformacionDeContactoStrategy';
import { IEntradaInformacionDeContacto } from '../Ports/IEntradaInformacionDeContacto';
import { IResultadoInformacionDeContactoOrdenado } from '../Ports/IResultadoInformacionDeContacto';
import { ValidadoraRedSocial } from '../Validations/ValidadoraRedSocial';

export const TIPO_RED_SOCIAL = 'RED_SOCIAL';

@Injectable()
export class AgregarRedSocialStrategy
implements IAgregarInformacionDeContactoStrategy<
  IResultadoInformacionDeContactoOrdenado<{ red: string; url: string }>
> {
  public constructor(private readonly validadoraRedSocial: ValidadoraRedSocial) {}

  public soporta(entrada: IEntradaInformacionDeContacto): boolean {
    return entrada.tipo === TIPO_RED_SOCIAL;
  }

  public ejecutar(
    informacion: CompanyContactInformation,
    entrada: IEntradaInformacionDeContacto,
  ): IResultadoInformacionDeContactoOrdenado<{ red: string; url: string }> {
    if (!this.soporta(entrada)) {
      throw new Error(`AgregarRedSocialStrategy solo procesa entradas de tipo '${TIPO_RED_SOCIAL}'.`);
    }

    // Misma validación que Modificar (acumula red + URL) vía ValidadoraRedSocial.
    const enlace = this.validadoraRedSocial.validar(entrada.datos);
    const displayOrder = informacion.socialLinks.length;
    if (!informacion.addSocialLink(enlace)) {
      throw InformacionDeContactoRechazadaException.conflicto('red', 'Ya existe una red social registrada con ese nombre.');
    }
    return {
      tipo: TIPO_RED_SOCIAL,
      companyProfileId: informacion.id.value,
      displayOrder,
      datos: { red: enlace.network, url: enlace.url.value },
    };
  }
}
