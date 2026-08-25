import { InicializarCompanyProfileCommand } from '../../CompanyProfile.Application/Commands/InicializarCompanyProfile/InicializarCompanyProfileCommand';
import { IResultadoInicializacion } from '../../CompanyProfile.Application/Ports/IResultadoInicializacion';
import { InicializarCompanyProfileRequestDto } from '../DTOs/InicializarCompanyProfileRequestDto';
import { InicializarCompanyProfileResponseDto } from '../DTOs/InicializarCompanyProfileResponseDto';

const CAMPO_CORREO_RECEPTOR = 'contact_request_recipient_email';

/** Traduce la frontera HTTP de inicialización del singleton `company_profile`. */
export class InicializarCompanyProfileMapper {
  public static toCommand(dto: InicializarCompanyProfileRequestDto): InicializarCompanyProfileCommand {
    return new InicializarCompanyProfileCommand((dto.payload ?? {})[CAMPO_CORREO_RECEPTOR]);
  }

  public static toResponse(resultado: IResultadoInicializacion): InicializarCompanyProfileResponseDto {
    return {
      payload: {
        id: resultado.companyProfileId,
        singleton_key: 1,
        [CAMPO_CORREO_RECEPTOR]: resultado.contactRequestRecipientEmail,
      },
    };
  }
}
