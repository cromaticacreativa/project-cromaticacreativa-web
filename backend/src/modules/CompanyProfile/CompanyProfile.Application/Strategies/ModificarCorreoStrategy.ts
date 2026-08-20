import { Inject, Injectable } from '@nestjs/common';
import { CompanyContactInformation } from '../../CompanyProfile.Domain/Aggregates/CompanyContactInformation';
import { EmailAddress } from '../../CompanyProfile.Domain/ValueObjects/EmailAddress';
import { InformacionDeContactoRechazadaException } from '../Exceptions/InformacionDeContactoRechazadaException';
import { CHILD_ACTUAL_READER, IChildActualReader } from '../Ports/IChildActualReader';
import {
  IEntradaModificacionDeContacto,
  IModificarInformacionDeContactoStrategy,
} from '../Ports/IModificarInformacionDeContactoStrategy';
import { IResultadoInformacionDeContacto } from '../Ports/IResultadoInformacionDeContacto';
import { ValidadoraCorreo } from '../Validations/ValidadoraCorreo';
import { TIPO_CORREO } from './AgregarCorreoStrategy';

const NO_EXISTE = 'El correo que intenta modificar ya no existe.';

@Injectable()
export class ModificarCorreoStrategy
implements IModificarInformacionDeContactoStrategy<IResultadoInformacionDeContacto<{ correo: string }>> {
  public constructor(
    private readonly validadoraCorreo: ValidadoraCorreo,
    @Inject(CHILD_ACTUAL_READER) private readonly reader: IChildActualReader,
  ) {}

  public soporta(entrada: IEntradaModificacionDeContacto): boolean {
    return entrada.tipo === TIPO_CORREO;
  }

  public async ejecutar(
    informacion: CompanyContactInformation,
    entrada: IEntradaModificacionDeContacto,
  ): Promise<IResultadoInformacionDeContacto<{ correo: string }>> {
    const nuevo = this.validadoraCorreo.validar(entrada.datos['correo']);
    const actualStr = await this.reader.leerCorreoActual(entrada.id);
    if (actualStr === null) {
      throw InformacionDeContactoRechazadaException.campo('correo', NO_EXISTE);
    }
    const resultado = informacion.changeEmail(new EmailAddress(actualStr), nuevo);
    if (resultado === 'duplicado') {
      throw InformacionDeContactoRechazadaException.conflicto('correo', 'Este correo electrónico ya está registrado.');
    }
    if (resultado === 'no-encontrado') {
      throw InformacionDeContactoRechazadaException.campo('correo', NO_EXISTE);
    }
    return { tipo: TIPO_CORREO, datos: { correo: nuevo.value } };
  }
}
