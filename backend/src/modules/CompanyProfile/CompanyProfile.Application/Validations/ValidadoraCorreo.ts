import { InvalidValueObjectException } from '../../CompanyProfile.Domain/Exceptions/InvalidValueObjectException';
import { EmailAddress } from '../../CompanyProfile.Domain/ValueObjects/EmailAddress';
import { InformacionDeContactoRechazadaException } from '../Exceptions/InformacionDeContactoRechazadaException';
import { IValidadora } from '../Ports/IValidadora';

const CAMPO = 'correo';

/**
 * Traduce la invariante compartida de EmailAddress al lenguaje de Application.
 * No replica formato, longitudes ni expresiones regulares del Domain.
 */
export class ValidadoraCorreo implements IValidadora<unknown, EmailAddress> {
  public validar(valor: unknown): EmailAddress {
    try {
      return new EmailAddress(valor);
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
        return 'El correo electrónico es obligatorio.';
      case 'vacio':
        return 'El correo electrónico no puede estar vacío.';
      case 'longitud':
        return 'El correo electrónico supera la longitud máxima permitida.';
      case 'dominio':
        return 'El correo electrónico debe incluir un dominio completo, por ejemplo: contacto@empresa.com.';
      case 'tld':
        return 'El dominio del correo electrónico debe tener una extensión válida, por ejemplo: .com, .net u .org.';
      default:
        return 'El correo electrónico debe tener un formato válido, por ejemplo: contacto@empresa.com.';
    }
  }
}
