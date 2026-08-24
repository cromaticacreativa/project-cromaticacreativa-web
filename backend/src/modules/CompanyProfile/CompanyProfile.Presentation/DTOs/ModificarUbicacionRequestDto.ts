/**
 * Contrato HTTP de entrada de HU25 (modificar ubicación). `id` es el
 * company_profile_id del row `location`; el payload puede ser parcial.
 */
export type ModificarUbicacionRequestDto = {
  collection: string;
  id: string;
  payload: Record<string, unknown>;
};
