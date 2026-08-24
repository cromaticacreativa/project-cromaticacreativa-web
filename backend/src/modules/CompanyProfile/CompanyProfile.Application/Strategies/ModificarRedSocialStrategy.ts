import { Inject, Injectable } from '@nestjs/common';
import { CompanyContactInformation } from '../../CompanyProfile.Domain/Aggregates/CompanyContactInformation';
import { ExternalUrl } from '../../CompanyProfile.Domain/ValueObjects/ExternalUrl';
import { SocialLink } from '../../CompanyProfile.Domain/ValueObjects/SocialLink';
import { InformacionDeContactoRechazadaException } from '../Exceptions/InformacionDeContactoRechazadaException';
import { CHILD_ACTUAL_READER, IChildActualReader } from '../Ports/IChildActualReader';
import {
  IEntradaModificacionDeContacto,
  IModificarInformacionDeContactoStrategy,
} from '../Ports/IModificarInformacionDeContactoStrategy';
import { IResultadoInformacionDeContacto } from '../Ports/IResultadoInformacionDeContacto';
import { ValidadoraRedSocial } from '../Validations/ValidadoraRedSocial';
import { TIPO_RED_SOCIAL } from './AgregarRedSocialStrategy';

const NO_EXISTE = 'La red social que intenta modificar ya no existe.';
// URL válida solo para reconstruir el SocialLink actual por su red (no se persiste).
const URL_DE_SONDEO = new ExternalUrl('https://example.com');

@Injectable()
export class ModificarRedSocialStrategy
implements IModificarInformacionDeContactoStrategy<IResultadoInformacionDeContacto<{ red: string; url: string }>> {
  public constructor(
    private readonly validadoraRedSocial: ValidadoraRedSocial,
    @Inject(CHILD_ACTUAL_READER) private readonly reader: IChildActualReader,
  ) {}

  public soporta(entrada: IEntradaModificacionDeContacto): boolean {
    return entrada.tipo === TIPO_RED_SOCIAL;
  }

  public async ejecutar(
    informacion: CompanyContactInformation,
    entrada: IEntradaModificacionDeContacto,
  ): Promise<IResultadoInformacionDeContacto<{ red: string; url: string }>> {
    // Misma validación acumulada (red + URL) que Agregar.
    const nuevo = this.validadoraRedSocial.validar(entrada.datos);
    const redActual = await this.reader.leerRedSocialActual(entrada.id);
    if (redActual === null) {
      throw InformacionDeContactoRechazadaException.campo('red', NO_EXISTE);
    }
    const resultado = informacion.changeSocialLink(new SocialLink(redActual, URL_DE_SONDEO), nuevo);
    if (resultado === 'duplicado') {
      throw InformacionDeContactoRechazadaException.conflicto('red', 'Ya existe una red social registrada con ese nombre.');
    }
    if (resultado === 'no-encontrado') {
      throw InformacionDeContactoRechazadaException.campo('red', NO_EXISTE);
    }
    return { tipo: TIPO_RED_SOCIAL, datos: { red: nuevo.network, url: nuevo.url.value } };
  }
}
