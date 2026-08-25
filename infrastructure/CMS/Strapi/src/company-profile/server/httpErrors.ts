import { BusinessRejectionError, TechnicalError } from './errors';

/**
 * Contexto Koa mínimo (evita acoplarnos a los tipos internos de Strapi/Koa). Se
 * declara con propiedades opcionales para ser un supertipo del contexto real de
 * Koa, de modo que los handlers sean asignables como middlewares de Strapi.
 */
export interface HttpCtx {
  status: number;
  body: unknown;
  params?: Record<string, string>;
  query?: Record<string, unknown>;
  request?: { body?: unknown };
}

/**
 * Traduce errores a una respuesta HTTP segura para el Admin. Nunca expone stack,
 * SQL, host de BD, token ni secretos.
 */
export function sendError(ctx: HttpCtx, error: unknown): void {
  if (error instanceof BusinessRejectionError) {
    ctx.status = error.status;
    ctx.body = { error: { status: error.status, message: error.message, details: { errors: error.errors } } };
    return;
  }
  if (error instanceof TechnicalError) {
    ctx.status = 502;
    ctx.body = { error: { status: 502, message: error.message } };
    return;
  }
  ctx.status = 500;
  ctx.body = { error: { status: 500, message: 'Ocurrió un error inesperado.' } };
}
