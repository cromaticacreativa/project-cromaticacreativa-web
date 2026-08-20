import { type CountryCode, parsePhoneNumberFromString } from 'libphonenumber-js';
import { PhoneNumber } from '../../CompanyProfile.Domain/ValueObjects/PhoneNumber';
import { IValidadora } from '../Ports/IValidadora';
import { InformacionDeContactoRechazadaException } from '../Exceptions/InformacionDeContactoRechazadaException';

const CAMPO = 'numero';

export class ValidadoraTelefono implements IValidadora<unknown, PhoneNumber> {
  public constructor(private readonly regionPorDefecto?: CountryCode) {}

  public validar(valor: unknown): PhoneNumber {
    if (valor === null || valor === undefined || typeof valor !== 'string') {
      throw InformacionDeContactoRechazadaException.campo(CAMPO, 'El número de teléfono es obligatorio.');
    }
    const entrada = valor.trim();
    if (!entrada) {
      throw InformacionDeContactoRechazadaException.campo(CAMPO, 'El número de teléfono no puede estar vacío.');
    }
    if (!this.regionPorDefecto && !entrada.startsWith('+')) {
      throw InformacionDeContactoRechazadaException.campo(
        CAMPO,
        "El número de teléfono debe incluir el código de país comenzando con '+'.",
      );
    }

    const numero = parsePhoneNumberFromString(entrada, this.regionPorDefecto);
    if (!numero || !numero.isValid()) {
      throw InformacionDeContactoRechazadaException.campo(
        CAMPO,
        'El número de teléfono no corresponde a un plan de numeración válido.',
      );
    }

    return new PhoneNumber(numero.number);
  }
}
