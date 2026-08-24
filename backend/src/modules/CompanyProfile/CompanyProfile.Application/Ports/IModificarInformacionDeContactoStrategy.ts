import { CompanyContactInformation } from '../../CompanyProfile.Domain/Aggregates/CompanyContactInformation';
import { IResultadoInformacionDeContacto } from './IResultadoInformacionDeContacto';

/**
 * Entrada de una modificación: el tipo (medio), el id persistente del registro a
 * modificar y los datos nuevos en lenguaje del caso de uso. El id no viaja al
 * Domain; sirve para resolver el valor actual en Infrastructure.
 */
export interface IEntradaModificacionDeContacto {
  readonly tipo: string;
  readonly id: string;
  readonly datos: Readonly<Record<string, unknown>>;
}

/**
 * Strategy de modificación (HU23). Mismo principio OCP que Agregar: el Handler
 * resuelve polimórficamente y no contiene `switch`. `ejecutar` es asíncrono porque
 * puede necesitar leer el valor actual del registro (por id) en Infrastructure.
 */
export interface IModificarInformacionDeContactoStrategy<
  TResultado extends IResultadoInformacionDeContacto = IResultadoInformacionDeContacto,
> {
  soporta(entrada: IEntradaModificacionDeContacto): boolean;

  ejecutar(
    informacion: CompanyContactInformation,
    entrada: IEntradaModificacionDeContacto,
  ): Promise<TResultado>;
}

export const MODIFICAR_INFORMACION_DE_CONTACTO_STRATEGIES = Symbol('ModificarInformacionDeContactoStrategies');
