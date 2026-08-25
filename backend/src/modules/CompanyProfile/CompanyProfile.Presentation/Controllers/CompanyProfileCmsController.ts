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
import { CmsServiceAuthGuard } from '../../../../Infrastructure/Security/CmsServiceAuthGuard';
import {
  IResultadoCorreoReceptor,
  IResultadoInformacionDeContactoOrdenado,
} from '../../CompanyProfile.Application/Ports/IResultadoInformacionDeContacto';
import { IResultadoInicializacion } from '../../CompanyProfile.Application/Ports/IResultadoInicializacion';
import { IResultadoUbicacion } from '../../CompanyProfile.Application/Ports/IResultadoUbicacion';
import { IValidationError } from '../../CompanyProfile.Application/Ports/IValidationError';
import { InformacionDeContactoRechazadaException } from '../../CompanyProfile.Application/Exceptions/InformacionDeContactoRechazadaException';
import { UbicacionRechazadaException } from '../../CompanyProfile.Application/Exceptions/UbicacionRechazadaException';
import { AgregarInformacionDeContactoRequestDto } from '../DTOs/AgregarInformacionDeContactoRequestDto';
import { AgregarInformacionDeContactoResponseDto } from '../DTOs/AgregarInformacionDeContactoResponseDto';
import { AgregarCorreoReceptorRequestDto } from '../DTOs/AgregarCorreoReceptorRequestDto';
import { AgregarCorreoReceptorResponseDto } from '../DTOs/AgregarCorreoReceptorResponseDto';
import { AgregarUbicacionRequestDto } from '../DTOs/AgregarUbicacionRequestDto';
import { AgregarUbicacionResponseDto } from '../DTOs/AgregarUbicacionResponseDto';
import { AgregarInformacionDeContactoMapper } from '../Mappers/AgregarInformacionDeContactoMapper';
import {
  AgregarCorreoReceptorMapper,
  CAMPO_CORREO_RECEPTOR,
} from '../Mappers/AgregarCorreoReceptorMapper';
import { AgregarUbicacionMapper } from '../Mappers/AgregarUbicacionMapper';
import { ModificarInformacionDeContactoMapper } from '../Mappers/ModificarInformacionDeContactoMapper';
import { ModificarUbicacionMapper } from '../Mappers/ModificarUbicacionMapper';
import { ModificarInformacionDeContactoRequestDto } from '../DTOs/ModificarInformacionDeContactoRequestDto';
import { ModificarUbicacionRequestDto } from '../DTOs/ModificarUbicacionRequestDto';
import { IResultadoInformacionDeContacto } from '../../CompanyProfile.Application/Ports/IResultadoInformacionDeContacto';
import { InicializarCompanyProfileMapper } from '../Mappers/InicializarCompanyProfileMapper';
import { InicializarCompanyProfileRequestDto } from '../DTOs/InicializarCompanyProfileRequestDto';
import { InicializarCompanyProfileResponseDto } from '../DTOs/InicializarCompanyProfileResponseDto';

/**
 * Traduce el vocabulario del caso de uso al nombre de columna de negocio que
 * expone cada formulario administrativo del CMS. Presentation es la única capa
 * que conoce esas columnas; el `field` viaja en `errors[]` para que el CMS pueda
 * asociar el error al campo correspondiente.
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

const CAMPO_A_COLUMNA_CORREO_RECEPTOR: Record<string, string> = {
  ...CAMPO_A_COLUMNA,
  correo: CAMPO_CORREO_RECEPTOR,
};

type RechazoDeNegocio = InformacionDeContactoRechazadaException | UbicacionRechazadaException;

/**
 * Frontera interna administrativa de CompanyProfile bajo `/internal/cms/company-profile`.
 *
 * Recibe operaciones administrativas de negocio (CREATE / UPDATE) delegadas por el
 * CMS: mapea el DTO a un Command, despacha por `CommandBus`, valida y canonicaliza
 * las reglas de negocio y devuelve el payload canónico al CMS. NestJS es la
 * autoridad de reglas de negocio, pero **no** ejecuta la escritura administrativa
 * final: en una fase posterior Strapi realizará esa escritura con el payload
 * devuelto. El schema de las tablas de negocio lo gobiernan las TypeORM migrations.
 *
 * Un rechazo de negocio se traduce a una respuesta HTTP estructurada:
 * `{ statusCode, message, errors: [{ field, message }] }`, con status 409 para un
 * conflicto de estado (duplicado / ubicación existente) y 422 para validación de
 * entrada. No se filtran clases, stack, SQL ni secretos.
 *
 * Solo cubre CREATE/UPDATE administrativos. GET y DELETE los resuelve el CMS
 * (Strapi) directamente contra MySQL y no pasan por aquí.
 *
 * - `initialize`: crea el singleton `company_profile` cuando no existe.
 * - `contact-information` (HU22): agrega teléfono, correo o red social.
 * - `contact-information/modify` (HU23): modifica teléfono, correo o red social.
 * - `location` (HU24): agrega la ubicación de la empresa.
 * - `location/modify` (HU25): modifica la ubicación.
 * - `contact-request-recipient-email`: cambia el correo receptor del Aggregate.
 *
 * Protegido por `CmsServiceAuthGuard` (token técnico `Bearer CMS_INTERNAL_TOKEN`,
 * service-to-service; no autentica personas). Está registrado en
 * `CompanyProfileModule` detrás de ese Guard.
 */
@Controller('internal/cms/company-profile')
@UseGuards(CmsServiceAuthGuard)
export class CompanyProfileCmsController {
  public constructor(private readonly commandBus: CommandBus) {}

  /**
   * Inicializa el singleton `company_profile` cuando no existe, con su único campo
   * obligatorio (correo receptor). Si ya existe, responde 409. El CMS ejecuta el
   * `INSERT` final con el payload canónico devuelto.
   */
  @Post('initialize')
  @HttpCode(200)
  public async inicializar(
    @Body() dto: InicializarCompanyProfileRequestDto,
  ): Promise<InicializarCompanyProfileResponseDto> {
    const command = InicializarCompanyProfileMapper.toCommand(dto);
    try {
      const resultado = await this.commandBus.execute<typeof command, IResultadoInicializacion>(command);
      return InicializarCompanyProfileMapper.toResponse(resultado);
    } catch (error) {
      if (error instanceof InformacionDeContactoRechazadaException) {
        throw this.aHttp(error, CAMPO_A_COLUMNA_CORREO_RECEPTOR);
      }
      throw error;
    }
  }

  @Post('contact-information')
  @HttpCode(200)
  public async agregarInformacionDeContacto(
    @Body() dto: AgregarInformacionDeContactoRequestDto,
  ): Promise<AgregarInformacionDeContactoResponseDto> {
    const command = AgregarInformacionDeContactoMapper.toCommand(dto);
    try {
      const resultado = await this.commandBus.execute<
        typeof command,
        IResultadoInformacionDeContactoOrdenado
      >(command);
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
   * HU23: modifica un teléfono, correo público o red social existente. Un único
   * Command resuelve el tipo por Strategy; el mapper hace el switch por colección.
   */
  @Post('contact-information/modify')
  @HttpCode(200)
  public async modificarInformacionDeContacto(
    @Body() dto: ModificarInformacionDeContactoRequestDto,
  ): Promise<AgregarInformacionDeContactoResponseDto> {
    const command = ModificarInformacionDeContactoMapper.toCommand(dto);
    try {
      const resultado = await this.commandBus.execute<typeof command, IResultadoInformacionDeContacto>(command);
      return ModificarInformacionDeContactoMapper.toResponse(resultado);
    } catch (error) {
      if (error instanceof InformacionDeContactoRechazadaException) {
        throw this.aHttp(error);
      }
      throw error;
    }
  }

  /** HU25: modifica la ubicación existente (flujo único, sin Strategy). */
  @Post('location/modify')
  @HttpCode(200)
  public async modificarUbicacion(
    @Body() dto: ModificarUbicacionRequestDto,
  ): Promise<AgregarUbicacionResponseDto> {
    const command = ModificarUbicacionMapper.toCommand(dto);
    try {
      const resultado = await this.commandBus.execute<typeof command, IResultadoUbicacion>(command);
      return ModificarUbicacionMapper.toResponse(resultado);
    } catch (error) {
      if (error instanceof UbicacionRechazadaException) {
        throw this.aHttp(error);
      }
      throw error;
    }
  }

  /**
   * Procesa el cambio del correo receptor mediante el mismo caso de uso y
   * Aggregate de la información de contacto. El CMS conserva la escritura final.
   */
  @Post('contact-request-recipient-email')
  @HttpCode(200)
  public async agregarCorreoReceptor(
    @Body() dto: AgregarCorreoReceptorRequestDto,
  ): Promise<AgregarCorreoReceptorResponseDto> {
    const command = AgregarCorreoReceptorMapper.toCommand(dto);
    try {
      const resultado = await this.commandBus.execute<typeof command, IResultadoCorreoReceptor>(
        command,
      );
      return AgregarCorreoReceptorMapper.toResponse(resultado);
    } catch (error) {
      if (error instanceof InformacionDeContactoRechazadaException) {
        throw this.aHttp(error, CAMPO_A_COLUMNA_CORREO_RECEPTOR);
      }
      throw error;
    }
  }

  /**
   * Construye la respuesta HTTP segura del rechazo de negocio: 409 si es un
   * conflicto de estado, 422 si es validación de entrada. El cuerpo incluye
   * `errors[]` con el `field` traducido a la columna de negocio.
   */
  private aHttp(
    rechazo: RechazoDeNegocio,
    campos: Readonly<Record<string, string>> = CAMPO_A_COLUMNA,
  ): HttpException {
    const status = rechazo.esConflicto ? 409 : 422;
    const errors = rechazo.errors.map((e: IValidationError) => ({
      field: campos[e.field] ?? e.field,
      message: e.message,
    }));
    const body = { statusCode: status, message: rechazo.message, errors };
    return rechazo.esConflicto ? new ConflictException(body) : new UnprocessableEntityException(body);
  }
}
