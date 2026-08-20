/**
 * Error de validación de un caso de uso, asociado a un campo concreto de la
 * entrada. Permite acumular y reportar varios problemas de una misma operación
 * (por ejemplo, dirección + latitud + longitud de una ubicación) en lugar de
 * abortar en el primero.
 *
 * `field` usa el vocabulario del caso de uso (`numero`, `correo`, `red`, `url`,
 * `direccion`, `latitud`, `longitud`). La traducción de ese nombre al campo
 * técnico de Directus (`number`, `address`, `network`, `latitude`, ...) es
 * responsabilidad de Presentation, no de Application ni de Domain.
 */
export interface IValidationError {
  readonly field: string;
  readonly message: string;
}
