import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpException,
  Post,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CmsInternalAuthGuard } from '../../../../Infrastructure/Security/CmsInternalAuthGuard';
import { IResultadoInformacionDeContacto } from '../../CompanyProfile.Application/Ports/IResultadoInformacionDeContacto';
import { IResultadoUbicacion } from '../../CompanyProfile.Application/Ports/IResultadoUbicacion';
import { IValidationError } from '../../CompanyProfile.Application/Ports/IValidationError';
import {
  IResultadoCorreoReceptor,
} from '../../CompanyProfile.Application/Commands/ValidarCorreoReceptor/ValidarCorreoReceptorCommandHandler';
import { ValidarCorreoReceptorCommand } from '../../CompanyProfile.Application/Commands/ValidarCorreoReceptor/ValidarCorreoReceptorCommand';
import { InformacionDeContactoRechazadaException } from '../../CompanyProfile.Application/Exceptions/InformacionDeContactoRechazadaException';
import { UbicacionRechazadaException } from '../../CompanyProfile.Application/Exceptions/UbicacionRechazadaException';
import { AgregarInformacionDeContactoRequestDto } from '../DTOs/AgregarInformacionDeContactoRequestDto';
import { AgregarInformacionDeContactoResponseDto } from '../DTOs/AgregarInformacionDeContactoResponseDto';
import { AgregarUbicacionRequestDto } from '../DTOs/AgregarUbicacionRequestDto';
import { AgregarUbicacionResponseDto } from '../DTOs/AgregarUbicacionResponseDto';
import { AgregarInformacionDeContactoMapper } from '../Mappers/AgregarInformacionDeContactoMapper';
import { AgregarUbicacionMapper } from '../Mappers/AgregarUbicacionMapper';

/**
 * Traduce el vocabulario del caso de uso al nombre de columna que Directus usa
 * en cada formulario. Presentation es la única capa que conoce esas columnas; el
 * `field` viaja en `errors[].extensions.field` para que Directus pueda asociar el
 * error al campo correspondiente.
 */
const CAMPO_A_COLUMNA: Record<string, string> = {
  numero: 'number',
  correo: 'address',
  red: 'network',
  url: 'url',
  direccion: 'address',
  latitud: 'latitude',
  longitud: 'longitude',
};

type RechazoDeNegocio = InformacionDeContactoRechazadaException | UbicacionRechazadaException;

/**
 * Frontera interna administrativa de CompanyProfile bajo `/internal/cms/company-profile`.
 *
 * La invoca el Filter Hook de Directus tras autenticarse con el token técnico
 * (ADR-023). El controller autentica (Guard), mapea el DTO a un Command, despacha
 * por `CommandBus` y devuelve el payload canónico. No contiene reglas de negocio,
 * validación, TypeORM ni reconstrucción del Aggregate.
 *
 * Un rechazo de negocio se traduce a una respuesta HTTP estructurada:
 * `{ statusCode, message, errors: [{ field, message }] }`, con status 409 para un
 * conflicto de estado (duplicado / ubicación existente) y 422 para validación de
 * entrada. No se filtran clases, stack, SQL ni secretos.
 *
 * - `contact-information` (HU22): agrega teléfono, correo o red social.
 * - `location` (HU24): agrega la ubicación de la empresa.
 */
@Controller('internal/cms/company-profile')
@UseGuards(CmsInternalAuthGuard)
export class CompanyProfileCmsController {
  public constructor(private readonly commandBus: CommandBus) {}

  @Post('contact-information')
  @HttpCode(200)
  public async agregarInformacionDeContacto(
    @Body() dto: AgregarInformacionDeContactoRequestDto,
  ): Promise<AgregarInformacionDeContactoResponseDto> {
    const command = AgregarInformacionDeContactoMapper.toCommand(dto);
    try {
      const resultado = await this.commandBus.execute<typeof command, IResultadoInformacionDeContacto>(command);
      return AgregarInformacionDeContactoMapper.toResponse(resultado);
    } catch (error) {
      if (error instanceof InformacionDeContactoRechazadaException) {
        throw this.aHttp(error);
      }
      throw error;
    }
  }

  @Post('location')
  @HttpCode(200)
  public async agregarUbicacion(
    @Body() dto: AgregarUbicacionRequestDto,
  ): Promise<AgregarUbicacionResponseDto> {
    const command = AgregarUbicacionMapper.toCommand(dto);
    try {
      const resultado = await this.commandBus.execute<typeof command, IResultadoUbicacion>(command);
      return AgregarUbicacionMapper.toResponse(resultado);
    } catch (error) {
      if (error instanceof UbicacionRechazadaException) {
        throw this.aHttp(error);
      }
      throw error;
    }
  }

  /**
   * Valida y canonicaliza el correo receptor de solicitudes antes de que Directus
   * actualice el singleton. NO persiste: solo aprueba/rechaza y devuelve el valor
   * canónico. HU23 completa sigue pendiente; esto cubre solo este campo.
   */
  @Post('contact-request-recipient-email')
  @HttpCode(200)
  public async validarCorreoReceptor(
    @Body() dto: { collection?: string; payload?: Record<string, unknown> },
  ): Promise<{ payload: Record<string, unknown> }> {
    const correo = (dto?.payload ?? {})['contact_request_recipient_email'];
    try {
      const resultado = await this.commandBus.execute<ValidarCorreoReceptorCommand, IResultadoCorreoReceptor>(
        new ValidarCorreoReceptorCommand(correo),
      );
      return { payload: { contact_request_recipient_email: resultado.correo } };
    } catch (error) {
      if (error instanceof InformacionDeContactoRechazadaException) {
        throw this.aHttp(error);
      }
      throw error;
    }
  }

  /**
   * Construye la respuesta HTTP segura del rechazo de negocio: 409 si es un
   * conflicto de estado, 422 si es validación de entrada. El cuerpo incluye
   * `errors[]` con el `field` traducido a la columna de Directus.
   */
  private aHttp(rechazo: RechazoDeNegocio): HttpException {
    const status = rechazo.esConflicto ? 409 : 422;
    const errors = rechazo.errors.map((e: IValidationError) => ({
      field: CAMPO_A_COLUMNA[e.field] ?? e.field,
      message: e.message,
    }));
    const body = { statusCode: status, message: rechazo.message, errors };
    return rechazo.esConflicto ? new ConflictException(body) : new UnprocessableEntityException(body);
  }
}
