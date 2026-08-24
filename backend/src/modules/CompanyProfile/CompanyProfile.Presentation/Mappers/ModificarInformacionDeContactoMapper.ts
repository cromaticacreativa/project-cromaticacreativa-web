import { BadRequestException } from '@nestjs/common';
import { ModificarInformacionDeContactoCommand } from '../../CompanyProfile.Application/Commands/ModificarInformacionDeContacto/ModificarInformacionDeContactoCommand';
import { IEntradaModificacionDeContacto } from '../../CompanyProfile.Application/Ports/IModificarInformacionDeContactoStrategy';
import { IResultadoInformacionDeContacto } from '../../CompanyProfile.Application/Ports/IResultadoInformacionDeContacto';
import { TIPO_CORREO } from '../../CompanyProfile.Application/Strategies/AgregarCorreoStrategy';
import { TIPO_RED_SOCIAL } from '../../CompanyProfile.Application/Strategies/AgregarRedSocialStrategy';
import { TIPO_TELEFONO } from '../../CompanyProfile.Application/Strategies/AgregarTelefonoStrategy';
import { ModificarInformacionDeContactoRequestDto } from '../DTOs/ModificarInformacionDeContactoRequestDto';
import { AgregarInformacionDeContactoResponseDto } from '../DTOs/AgregarInformacionDeContactoResponseDto';

const COLECCION_TELEFONO = 'phone';
const COLECCION_CORREO = 'email';
const COLECCION_RED_SOCIAL = 'social_link';

/**
 * Traduce la frontera del CMS (colección + id + payload) hacia la entrada del
 * caso de uso de modificación, y el resultado canónico de vuelta al payload
 * técnico. El `switch` por colección vive solo aquí (Presentation). La respuesta
 * de update NO incluye `company_profile_id` ni `display_order` (no cambian).
 */
export class ModificarInformacionDeContactoMapper {
  public static toCommand(dto: ModificarInformacionDeContactoRequestDto): ModificarInformacionDeContactoCommand {
    const payload = dto.payload ?? {};
    let entrada: IEntradaModificacionDeContacto;
    switch (dto.collection) {
      case COLECCION_TELEFONO:
        entrada = { tipo: TIPO_TELEFONO, id: dto.id, datos: { numero: payload['number'] } };
        break;
      case COLECCION_CORREO:
        entrada = { tipo: TIPO_CORREO, id: dto.id, datos: { correo: payload['address'] } };
        break;
      case COLECCION_RED_SOCIAL:
        entrada = { tipo: TIPO_RED_SOCIAL, id: dto.id, datos: { red: payload['network'], url: payload['url'] } };
        break;
      default:
        throw new BadRequestException(`La colección '${dto.collection}' no admite modificación de contacto.`);
    }
    return new ModificarInformacionDeContactoCommand(entrada);
  }

  public static toResponse(resultado: IResultadoInformacionDeContacto): AgregarInformacionDeContactoResponseDto {
    switch (resultado.tipo) {
      case TIPO_TELEFONO:
        return { payload: { number: this.dato(resultado, 'numero') } };
      case TIPO_CORREO:
        return { payload: { address: this.dato(resultado, 'correo') } };
      case TIPO_RED_SOCIAL:
        return { payload: { network: this.dato(resultado, 'red'), url: this.dato(resultado, 'url') } };
      default:
        throw new BadRequestException(
          `El resultado de tipo '${resultado.tipo}' no tiene traducción de frontera para el CMS.`,
        );
    }
  }

  private static dato(resultado: IResultadoInformacionDeContacto, clave: string): string {
    const valor = resultado.datos[clave];
    if (typeof valor !== 'string') {
      throw new BadRequestException(`El resultado canónico no contiene el dato '${clave}'.`);
    }
    return valor;
  }
}
