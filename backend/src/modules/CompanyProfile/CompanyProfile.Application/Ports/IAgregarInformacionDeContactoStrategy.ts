import { CompanyContactInformation } from '../../CompanyProfile.Domain/Aggregates/CompanyContactInformation';
import { IEntradaInformacionDeContacto } from './IEntradaInformacionDeContacto';
import { IResultadoInformacionDeContacto } from './IResultadoInformacionDeContacto';

export interface IAgregarInformacionDeContactoStrategy<
  TResultado extends IResultadoInformacionDeContacto = IResultadoInformacionDeContacto,
> {
  soporta(entrada: IEntradaInformacionDeContacto): boolean;

  ejecutar(
    informacion: CompanyContactInformation,
    entrada: IEntradaInformacionDeContacto,
  ): TResultado;
}

export const AGREGAR_INFORMACION_DE_CONTACTO_STRATEGIES = Symbol('AgregarInformacionDeContactoStrategies');
