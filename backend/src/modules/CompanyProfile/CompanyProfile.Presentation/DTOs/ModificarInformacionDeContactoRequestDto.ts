/**
 * Contrato HTTP de entrada de HU23 (modificar). El Filter Hook envía la colección
 * de origen, el id del registro a modificar y el payload parcial del update.
 */
export type ModificarInformacionDeContactoRequestDto = {
  collection: string;
  id: string;
  payload: Record<string, unknown>;
};
