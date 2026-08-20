import { Inject, Injectable } from '@nestjs/common';
import { CompanyContactInformation } from '../../CompanyProfile.Domain/Aggregates/CompanyContactInformation';
import { PhoneNumber } from '../../CompanyProfile.Domain/ValueObjects/PhoneNumber';
import { InformacionDeContactoRechazadaException } from '../Exceptions/InformacionDeContactoRechazadaException';
import { CHILD_ACTUAL_READER, IChildActualReader } from '../Ports/IChildActualReader';
import {
  IEntradaModificacionDeContacto,
  IModificarInformacionDeContactoStrategy,
} from '../Ports/IModificarInformacionDeContactoStrategy';
import { IResultadoInformacionDeContacto } from '../Ports/IResultadoInformacionDeContacto';
import { ValidadoraTelefono } from '../Validations/ValidadoraTelefono';
import { TIPO_TELEFONO } from './AgregarTelefonoStrategy';

const NO_EXISTE = 'El teléfono que intenta modificar ya no existe.';

@Injectable()
export class ModificarTelefonoStrategy
implements IModificarInformacionDeContactoStrategy<IResultadoInformacionDeContacto<{ numero: string }>> {
  public constructor(
    private readonly validadoraTelefono: ValidadoraTelefono,
    @Inject(CHILD_ACTUAL_READER) private readonly reader: IChildActualReader,
  ) {}

  public soporta(entrada: IEntradaModificacionDeContacto): boolean {
    return entrada.tipo === TIPO_TELEFONO;
  }

  public async ejecutar(
    informacion: CompanyContactInformation,
    entrada: IEntradaModificacionDeContacto,
  ): Promise<IResultadoInformacionDeContacto<{ numero: string }>> {
    // Misma validación que Agregar (mismo Value Object y mensajes).
    const nuevo = this.validadoraTelefono.validar(entrada.datos['numero']);
    const actualStr = await this.reader.leerTelefonoActual(entrada.id);
    if (actualStr === null) {
      throw InformacionDeContactoRechazadaException.campo('numero', NO_EXISTE);
    }
    // La unicidad excluye el propio registro: guardar sin cambiar el valor no es duplicado.
    const resultado = informacion.changePhone(new PhoneNumber(actualStr), nuevo);
    if (resultado === 'duplicado') {
      throw InformacionDeContactoRechazadaException.conflicto('numero', 'Este número de teléfono ya está registrado.');
    }
    if (resultado === 'no-encontrado') {
      throw InformacionDeContactoRechazadaException.campo('numero', NO_EXISTE);
    }
    return { tipo: TIPO_TELEFONO, datos: { numero: nuevo.value } };
  }
}
