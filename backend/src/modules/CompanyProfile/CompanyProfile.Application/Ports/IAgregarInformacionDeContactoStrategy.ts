import { CompanyContactInformation } from '../../CompanyProfile.Domain/Aggregates/CompanyContactInformation';
import { IEntradaInformacionDeContacto } from './IEntradaInformacionDeContacto';
import { IResultadoInformacionDeContacto } from './IResultadoInformacionDeContacto';

export interface IAgregarInformacionDeContactoStrategy {
  soporta(entrada: IEntradaInformacionDeContacto): boolean;

  ejecutar(
    informacion: CompanyContactInformation,
    entrada: IEntradaInformacionDeContacto,
  ): IResultadoInformacionDeContacto;
}

export const AGREGAR_INFORMACION_DE_CONTACTO_STRATEGIES = Symbol('AgregarInformacionDeContactoStrategies');
