import { InvalidGeoCoordinatesException } from '../../CompanyProfile.Domain/Exceptions/InvalidGeoCoordinatesException';
import { InvalidValueObjectException } from '../../CompanyProfile.Domain/Exceptions/InvalidValueObjectException';
import { IValidationError } from '../Ports/IValidationError';

/**
 * Rechazo de negocio del caso de uso "Agregar ubicación".
 *
 * Puede transportar un mensaje general y una lista `errors` con los campos
 * inválidos de la misma operación (`direccion`, `latitud`, `longitud`), de modo
 * que se muestren juntos en lugar de uno por uno. `esConflicto` distingue un
 * conflicto de estado (ya existe una ubicación, HTTP 409) de una validación de
 * entrada (HTTP 422). Domain conserva la autoridad de las invariantes.
 */
export class UbicacionRechazadaException extends Error {
  public readonly errors: readonly IValidationError[];
  public readonly esConflicto: boolean;

  public constructor(message: string, errors: readonly IValidationError[] = [], esConflicto = false) {
    super(message);
    this.name = 'UbicacionRechazadaException';
    this.errors = errors;
    this.esConflicto = esConflicto;
  }

  /** Conflicto de estado (ya existe una ubicación); se traduce a HTTP 409. */
  public static conflicto(message: string): UbicacionRechazadaException {
    return new UbicacionRechazadaException(message, [], true);
  }

  /** Acumula varios errores de validación de la misma operación (HTTP 422). */
  public static acumulada(errors: readonly IValidationError[]): UbicacionRechazadaException {
    const message = errors.length === 1 ? errors[0]!.message : 'Hay errores de validación.';
    return new UbicacionRechazadaException(message, errors);
  }

  public static desdeValidezDeDominio<T>(construir: () => T): T {
    try {
      return construir();
    } catch (error) {
      if (error instanceof InvalidValueObjectException || error instanceof InvalidGeoCoordinatesException) {
        throw new UbicacionRechazadaException(error.message, [{ field: '', message: error.message }]);
      }
      throw error;
    }
  }

  /**
   * Intenta construir un objeto de Domain y, si su validez falla, devuelve el
   * error del campo (para acumular) en lugar de lanzarlo. Reutiliza la invariante
   * del Domain como autoridad, sin duplicar rangos ni reglas.
   */
  public static capturarCampo(field: string, construir: () => unknown): IValidationError | null {
    try {
      construir();
      return null;
    } catch (error) {
      if (error instanceof InvalidValueObjectException || error instanceof InvalidGeoCoordinatesException) {
        return { field, message: error.message };
      }
      throw error;
    }
  }
}
