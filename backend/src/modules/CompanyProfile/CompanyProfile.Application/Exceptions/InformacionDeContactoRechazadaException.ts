import { InvalidValueObjectException } from '../../CompanyProfile.Domain/Exceptions/InvalidValueObjectException';
import { IValidationError } from '../Ports/IValidationError';

/**
 * Rechazo de negocio del caso de uso "Agregar información de contacto".
 *
 * Puede transportar un mensaje general y una lista `errors` de errores por campo
 * (`field` en vocabulario del caso de uso). `esConflicto` distingue un conflicto
 * de estado (duplicado, HTTP 409) de una validación de entrada (HTTP 422). La
 * traducción a HTTP y el mapeo de `field` a las columnas de Directus ocurren en
 * Presentation; Domain sigue siendo la autoridad de las invariantes.
 */
export class InformacionDeContactoRechazadaException extends Error {
  public readonly errors: readonly IValidationError[];
  public readonly esConflicto: boolean;

  public constructor(message: string, errors: readonly IValidationError[] = [], esConflicto = false) {
    super(message);
    this.name = 'InformacionDeContactoRechazadaException';
    this.errors = errors;
    this.esConflicto = esConflicto;
  }

  /** Rechazo de validación de un único campo (el mensaje general es el del campo). */
  public static campo(field: string, message: string): InformacionDeContactoRechazadaException {
    return new InformacionDeContactoRechazadaException(message, [{ field, message }]);
  }

  /** Conflicto de estado (duplicado) sobre un campo; se traduce a HTTP 409. */
  public static conflicto(field: string, message: string): InformacionDeContactoRechazadaException {
    return new InformacionDeContactoRechazadaException(message, [{ field, message }], true);
  }

  /** Acumula varios errores de validación de la misma operación (HTTP 422). */
  public static acumulada(errors: readonly IValidationError[]): InformacionDeContactoRechazadaException {
    const message = errors.length === 1 ? errors[0]!.message : 'Hay errores de validación.';
    return new InformacionDeContactoRechazadaException(message, errors);
  }

  /**
   * Ejecuta la construcción de un objeto de Domain y traduce su excepción de
   * validez (Value Object) en un rechazo de negocio asociado a `field`. Reutiliza
   * la invariante del Domain como autoridad; no la duplica.
   */
  public static desdeValidezDeDominio<T>(field: string, construir: () => T): T {
    try {
      return construir();
    } catch (error) {
      if (error instanceof InvalidValueObjectException) {
        throw InformacionDeContactoRechazadaException.campo(field, error.message);
      }
      throw error;
    }
  }

  /**
   * Intenta construir un objeto de Domain y, si su validez falla, devuelve el
   * error del campo (para acumular) en lugar de lanzarlo. Un error no esperado
   * (no de validez de Value Object) se propaga.
   */
  public static capturarCampo(field: string, construir: () => unknown): IValidationError | null {
    try {
      construir();
      return null;
    } catch (error) {
      if (error instanceof InvalidValueObjectException) {
        return { field, message: error.message };
      }
      throw error;
    }
  }
}
