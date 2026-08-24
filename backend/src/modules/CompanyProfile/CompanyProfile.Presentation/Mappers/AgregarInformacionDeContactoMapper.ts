import { BadRequestException } from '@nestjs/common';
import { AgregarInformacionDeContactoCommand } from '../../CompanyProfile.Application/Commands/AgregarInformacionDeContacto/AgregarInformacionDeContactoCommand';
import { IEntradaInformacionDeContacto } from '../../CompanyProfile.Application/Ports/IEntradaInformacionDeContacto';
import { IResultadoInformacionDeContactoOrdenado } from '../../CompanyProfile.Application/Ports/IResultadoInformacionDeContacto';
import { TIPO_CORREO } from '../../CompanyProfile.Application/Strategies/AgregarCorreoStrategy';
import { TIPO_RED_SOCIAL } from '../../CompanyProfile.Application/Strategies/AgregarRedSocialStrategy';
import { TIPO_TELEFONO } from '../../CompanyProfile.Application/Strategies/AgregarTelefonoStrategy';
import { AgregarInformacionDeContactoRequestDto } from '../DTOs/AgregarInformacionDeContactoRequestDto';
import { AgregarInformacionDeContactoResponseDto } from '../DTOs/AgregarInformacionDeContactoResponseDto';

/** Colecciones (tablas de negocio) que HU22 crea desde el CMS administrativo. */
export const COLECCION_TELEFONO = 'phone';
export const COLECCION_CORREO = 'email';
export const COLECCION_RED_SOCIAL = 'social_link';

/**
 * Traduce la frontera técnica del CMS (colección + payload) hacia la entrada
 * abierta del caso de uso y traduce el resultado canónico de vuelta al payload
 * técnico que el CMS persistirá.
 *
 * Presentation es la única capa que conoce las colecciones y los nombres de
 * columna de negocio; Application usa el lenguaje del caso de uso. Un medio
 * nuevo que llegue mediante una colección/forma nueva del CMS se soporta
 * extendiendo esta traducción de frontera, sin acoplar Application al CMS.
 * El Mapper no contiene reglas de negocio ni valida planes telefónicos.
 */
export class AgregarInformacionDeContactoMapper {
  public static toCommand(dto: AgregarInformacionDeContactoRequestDto): AgregarInformacionDeContactoCommand {
    const payload = dto.payload ?? {};
    let entrada: IEntradaInformacionDeContacto;
    switch (dto.collection) {
      case COLECCION_TELEFONO:
        entrada = { tipo: TIPO_TELEFONO, datos: { numero: payload['number'] } };
        break;
      case COLECCION_CORREO:
        entrada = { tipo: TIPO_CORREO, datos: { correo: payload['address'] } };
        break;
      case COLECCION_RED_SOCIAL:
        entrada = {
          tipo: TIPO_RED_SOCIAL,
          datos: { red: payload['network'], url: payload['url'] },
        };
        break;
      default:
        throw new BadRequestException(`La colección '${dto.collection}' no forma parte de HU22.`);
    }
    return new AgregarInformacionDeContactoCommand(entrada);
  }

  public static toResponse(resultado: IResultadoInformacionDeContactoOrdenado): AgregarInformacionDeContactoResponseDto {
    switch (resultado.tipo) {
      case TIPO_TELEFONO:
        return {
          payload: {
            company_profile_id: resultado.companyProfileId,
            number: this.dato(resultado, 'numero'),
            display_order: resultado.displayOrder,
          },
        };
      case TIPO_CORREO:
        return {
          payload: {
            company_profile_id: resultado.companyProfileId,
            address: this.dato(resultado, 'correo'),
            display_order: resultado.displayOrder,
          },
        };
      case TIPO_RED_SOCIAL:
        return {
          payload: {
            company_profile_id: resultado.companyProfileId,
            network: this.dato(resultado, 'red'),
            url: this.dato(resultado, 'url'),
            display_order: resultado.displayOrder,
          },
        };
      default:
        throw new BadRequestException(
          `El resultado de tipo '${resultado.tipo}' no tiene traducción de frontera para el CMS.`,
        );
    }
  }

  private static dato(resultado: IResultadoInformacionDeContactoOrdenado, clave: string): string {
    const valor = resultado.datos[clave];
    if (typeof valor !== 'string') {
      throw new BadRequestException(`El resultado canónico no contiene el dato '${clave}'.`);
    }
    return valor;
  }
}
