import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InvalidValueObjectException } from '../../../CompanyProfile.Domain/Exceptions/InvalidValueObjectException';
import { EmailAddress } from '../../../CompanyProfile.Domain/ValueObjects/EmailAddress';
import { InformacionDeContactoRechazadaException } from '../../Exceptions/InformacionDeContactoRechazadaException';
import { ValidarCorreoReceptorCommand } from './ValidarCorreoReceptorCommand';

/** Campo (columna de Directus) del correo receptor. Se usa para el error inline. */
const CAMPO = 'contact_request_recipient_email';

/**
 * Resultado canónico: el correo normalizado listo para que Directus lo persista.
 */
export interface IResultadoCorreoReceptor {
  readonly correo: string;
}

@CommandHandler(ValidarCorreoReceptorCommand)
export class ValidarCorreoReceptorCommandHandler
implements ICommandHandler<ValidarCorreoReceptorCommand, IResultadoCorreoReceptor> {
  public async execute(command: ValidarCorreoReceptorCommand): Promise<IResultadoCorreoReceptor> {
    // EmailAddress es la autoridad de formato/longitud (misma regla que el correo
    // público); aquí solo se traduce su `reason` a un mensaje específico del correo
    // receptor, sin duplicar la regla ni una regex.
    try {
      const email = new EmailAddress(command.correo);
      return { correo: email.value };
    } catch (error) {
      if (error instanceof InvalidValueObjectException) {
        throw InformacionDeContactoRechazadaException.campo(CAMPO, this.mensaje(error.reason));
      }
      throw error;
    }
  }

  private mensaje(reason: string | undefined): string {
    switch (reason) {
      case 'obligatorio':
        return 'El correo receptor de solicitudes es obligatorio.';
      case 'vacio':
        return 'El correo receptor de solicitudes no puede estar vacío.';
      case 'longitud':
        return 'El correo receptor de solicitudes supera la longitud máxima permitida.';
      case 'dominio':
        return 'El correo receptor de solicitudes debe incluir un dominio completo, por ejemplo: contacto@empresa.com.';
      case 'tld':
        return 'El dominio del correo receptor de solicitudes debe tener una extensión válida, por ejemplo: .com, .net u .org.';
      default:
        return 'El correo receptor de solicitudes debe tener un formato válido, por ejemplo: contacto@empresa.com.';
    }
  }
}
