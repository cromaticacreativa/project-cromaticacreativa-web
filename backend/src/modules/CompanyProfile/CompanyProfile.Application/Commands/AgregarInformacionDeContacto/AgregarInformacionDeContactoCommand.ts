import type { IEntradaInformacionDeContacto } from '../../Ports/IEntradaInformacionDeContacto';

export class AgregarInformacionDeContactoCommand {
  public constructor(public readonly entrada: IEntradaInformacionDeContacto) {}
}
