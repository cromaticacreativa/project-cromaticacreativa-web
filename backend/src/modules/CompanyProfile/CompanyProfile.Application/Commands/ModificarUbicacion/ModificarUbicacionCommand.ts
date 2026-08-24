/**
 * Modifica la ubicación existente (HU25). Flujo único (sin Strategy). Los campos
 * son opcionales: un update parcial de Directus puede traer solo los cambiados; el
 * Handler completa los ausentes con el valor actual del Aggregate.
 */
export class ModificarUbicacionCommand {
  public constructor(
    public readonly direccion?: string,
    public readonly latitud?: number,
    public readonly longitud?: number,
  ) {}
}
