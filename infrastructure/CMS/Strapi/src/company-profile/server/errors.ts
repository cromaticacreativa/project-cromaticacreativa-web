/** Error de negocio seguro para la UI: mensaje general + errores por campo. */
export interface FieldError {
  field: string;
  message: string;
}

export class BusinessRejectionError extends Error {
  public constructor(
    message: string,
    public readonly status: number,
    public readonly errors: FieldError[] = [],
  ) {
    super(message);
    this.name = 'BusinessRejectionError';
  }
}

/** Error técnico genérico; nunca expone stack, SQL, host de BD ni secretos. */
export class TechnicalError extends Error {
  public constructor(message = 'No se pudo completar la operación. Inténtelo de nuevo más tarde.') {
    super(message);
    this.name = 'TechnicalError';
  }
}

/**
 * Traduce un error de constraint de MySQL (ventana de concurrencia
 * validar→escribir) a un rechazo administrativo seguro. No elimina constraints:
 * las respeta y traduce. Cualquier otro error se degrada a TechnicalError.
 */
export function mapDatabaseError(error: unknown): BusinessRejectionError | TechnicalError {
  const code = (error as { code?: string } | null)?.code;
  switch (code) {
    case 'ER_DUP_ENTRY':
      return new BusinessRejectionError('El valor ya existe.', 409);
    case 'ER_NO_REFERENCED_ROW_2':
    case 'ER_ROW_IS_REFERENCED_2':
      return new BusinessRejectionError('La operación viola una relación entre registros.', 409);
    case 'ER_CHECK_CONSTRAINT_VIOLATED':
      return new BusinessRejectionError('El valor no cumple una restricción de datos.', 422);
    default:
      return new TechnicalError();
  }
}
