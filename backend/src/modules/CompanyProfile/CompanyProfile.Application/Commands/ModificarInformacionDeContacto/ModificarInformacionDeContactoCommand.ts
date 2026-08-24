import type { IEntradaModificacionDeContacto } from '../../Ports/IModificarInformacionDeContactoStrategy';

/**
 * Un único Command para modificar teléfono, correo público o red social (HU23).
 * El comportamiento específico lo resuelve una Strategy; el Command solo
 * transporta la entrada (tipo, id, datos).
 */
export class ModificarInformacionDeContactoCommand {
  public constructor(public readonly entrada: IEntradaModificacionDeContacto) {}
}
