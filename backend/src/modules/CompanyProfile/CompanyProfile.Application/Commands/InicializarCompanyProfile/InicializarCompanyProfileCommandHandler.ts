import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';
import { CompanyContactInformation } from '../../../CompanyProfile.Domain/Aggregates/CompanyContactInformation';
import { CompanyContactInformationId } from '../../../CompanyProfile.Domain/ValueObjects/CompanyContactInformationId';
import { InformacionDeContactoRechazadaException } from '../../Exceptions/InformacionDeContactoRechazadaException';
import {
  COMPANY_PROFILE_STATE_READER,
  ICompanyProfileStateReader,
} from '../../Ports/ICompanyProfileStateReader';
import { IResultadoInicializacion } from '../../Ports/IResultadoInicializacion';
import { ValidadoraCorreo } from '../../Validations/ValidadoraCorreo';
import { InicializarCompanyProfileCommand } from './InicializarCompanyProfileCommand';

/**
 * Crea el singleton `company_profile` cuando no existe: valida y canonicaliza el
 * correo receptor (`ValidadoraCorreo`, reutilizada), proporciona el UUID de
 * identidad desde Application (`randomUUID`) y construye el Aggregate fresco para
 * respetar sus invariantes. NO persiste: devuelve el payload canónico y el CMS
 * (Strapi) ejecuta el `INSERT` final. Si el perfil ya existe, rechaza (409).
 */
@CommandHandler(InicializarCompanyProfileCommand)
export class InicializarCompanyProfileCommandHandler
implements ICommandHandler<InicializarCompanyProfileCommand, IResultadoInicializacion> {
  public constructor(
    @Inject(COMPANY_PROFILE_STATE_READER) private readonly estado: ICompanyProfileStateReader,
    private readonly validadoraCorreo: ValidadoraCorreo,
  ) {}

  public async execute(command: InicializarCompanyProfileCommand): Promise<IResultadoInicializacion> {
    const existente = await this.estado.leerInformacionDeContacto();
    if (existente) {
      throw InformacionDeContactoRechazadaException.conflicto(
        'correo',
        'La información de contacto de la empresa ya fue inicializada.',
      );
    }

    const recipient = this.validadoraCorreo.validar(command.contactRequestRecipientEmail);
    const id = new CompanyContactInformationId(randomUUID());
    const informacion = CompanyContactInformation.create(id, recipient);

    return {
      companyProfileId: informacion.id.value,
      contactRequestRecipientEmail: informacion.contactRequestRecipientEmail.value,
    };
  }
}
