import { BadRequestException } from '@nestjs/common';
import { AgregarInformacionDeContactoCommand } from '../../CompanyProfile.Application/Commands/AgregarInformacionDeContacto/AgregarInformacionDeContactoCommand';
import { IResultadoCorreoReceptor } from '../../CompanyProfile.Application/Ports/IResultadoInformacionDeContacto';
import { TIPO_CORREO_RECEPTOR } from '../../CompanyProfile.Application/Strategies/AgregarCorreoReceptorStrategy';
import { AgregarCorreoReceptorRequestDto } from '../DTOs/AgregarCorreoReceptorRequestDto';
import { AgregarCorreoReceptorResponseDto } from '../DTOs/AgregarCorreoReceptorResponseDto';

export const CAMPO_CORREO_RECEPTOR = 'contact_request_recipient_email';

/** Traduce exclusivamente la frontera HTTP del correo receptor. */
export class AgregarCorreoReceptorMapper {
  public static toCommand(dto: AgregarCorreoReceptorRequestDto): AgregarInformacionDeContactoCommand {
    return new AgregarInformacionDeContactoCommand({
      tipo: TIPO_CORREO_RECEPTOR,
      datos: { correo: (dto.payload ?? {})[CAMPO_CORREO_RECEPTOR] },
    });
  }

  public static toResponse(resultado: IResultadoCorreoReceptor): AgregarCorreoReceptorResponseDto {
    const correo = resultado.datos.correo;
    if (typeof correo !== 'string') {
      throw new BadRequestException("El resultado canónico no contiene el dato 'correo'.");
    }
    return { payload: { [CAMPO_CORREO_RECEPTOR]: correo } };
  }
}
