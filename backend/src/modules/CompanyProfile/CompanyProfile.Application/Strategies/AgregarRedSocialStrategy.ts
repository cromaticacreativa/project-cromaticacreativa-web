import { Injectable } from '@nestjs/common';
import { CompanyContactInformation } from '../../CompanyProfile.Domain/Aggregates/CompanyContactInformation';
import { ExternalUrl } from '../../CompanyProfile.Domain/ValueObjects/ExternalUrl';
import { SocialLink } from '../../CompanyProfile.Domain/ValueObjects/SocialLink';
import { InformacionDeContactoRechazadaException } from '../Exceptions/InformacionDeContactoRechazadaException';
import { IAgregarInformacionDeContactoStrategy } from '../Ports/IAgregarInformacionDeContactoStrategy';
import { IEntradaInformacionDeContacto } from '../Ports/IEntradaInformacionDeContacto';
import { IResultadoInformacionDeContacto } from '../Ports/IResultadoInformacionDeContacto';
import { IValidationError } from '../Ports/IValidationError';

export const TIPO_RED_SOCIAL = 'RED_SOCIAL';

/**
 * URL válida de sondeo para aislar la validación de la red (`network`) cuando la
 * URL real es inválida. Permite reportar el error de la red y el de la URL de la
 * misma operación juntos, reutilizando la invariante de `SocialLink` sin
 * duplicarla. No se persiste: el enlace definitivo se construye con la URL real.
 */
const URL_DE_SONDEO = new ExternalUrl('https://example.com');

@Injectable()
export class AgregarRedSocialStrategy implements IAgregarInformacionDeContactoStrategy {
  public soporta(entrada: IEntradaInformacionDeContacto): boolean {
    return entrada.tipo === TIPO_RED_SOCIAL;
  }

  public ejecutar(
    informacion: CompanyContactInformation,
    entrada: IEntradaInformacionDeContacto,
  ): IResultadoInformacionDeContacto {
    if (!this.soporta(entrada)) {
      throw new Error(`AgregarRedSocialStrategy solo procesa entradas de tipo '${TIPO_RED_SOCIAL}'.`);
    }

    // Se validan red y URL de forma independiente para acumular ambos errores de
    // la misma operación (§12). Cada validez la aporta el Domain (SocialLink /
    // ExternalUrl); aquí solo se recogen los rechazos.
    const errores: IValidationError[] = [];
    const errorRed = InformacionDeContactoRechazadaException.capturarCampo(
      'red',
      () => new SocialLink(entrada.datos['red'], URL_DE_SONDEO),
    );
    if (errorRed) errores.push(errorRed);
    const errorUrl = InformacionDeContactoRechazadaException.capturarCampo(
      'url',
      () => new ExternalUrl(entrada.datos['url']),
    );
    if (errorUrl) errores.push(errorUrl);
    if (errores.length > 0) {
      throw InformacionDeContactoRechazadaException.acumulada(errores);
    }

    const enlace = new SocialLink(entrada.datos['red'], new ExternalUrl(entrada.datos['url']));
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
