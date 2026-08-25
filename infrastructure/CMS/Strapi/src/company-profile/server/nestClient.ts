import { BusinessRejectionError, FieldError, TechnicalError } from './errors';

export interface NestClientConfig {
  /** BACKEND_INTERNAL_URL, p. ej. http://localhost:3000 o https://api.cromaticacreativa.com */
  baseUrl: string | undefined;
  /** CMS_INTERNAL_TOKEN; compartido con el backend, solo en el servidor. */
  token: string | undefined;
  /** Timeout en ms (por defecto 8000). */
  timeoutMs?: number;
  /** `fetch` inyectable (para tests). Por defecto el global de Node 22. */
  fetchFn?: typeof fetch;
}

/**
 * Cliente HTTP server-side del CMS (Strapi) hacia los endpoints internos de NestJS
 * `/internal/cms/company-profile/*`. Envía `Authorization: Bearer <CMS_INTERNAL_TOKEN>`.
 *
 * Fail closed: si falta `baseUrl` o `token`, no realiza la solicitud y lanza
 * `TechnicalError`. Si NestJS rechaza (4xx con errores de negocio), lanza
 * `BusinessRejectionError` con los `errors[]` traducibles a la UI. Ante caída,
 * timeout o 5xx, lanza `TechnicalError`. En ningún caso propaga stack/SQL/secretos.
 */
export class NestInternalClient {
  private readonly baseUrl?: string;
  private readonly token?: string;
  private readonly timeoutMs: number;
  private readonly fetchFn: typeof fetch;

  public constructor(config: NestClientConfig) {
    this.baseUrl = config.baseUrl?.replace(/\/+$/, '');
    this.token = config.token;
    this.timeoutMs = config.timeoutMs ?? 8000;
    this.fetchFn = config.fetchFn ?? fetch;
  }

  /**
   * POST a un endpoint interno; devuelve el `payload` canónico aprobado.
   * @param path por ejemplo 'contact-information' o 'location/modify'
   */
  public async post<TPayload = Record<string, unknown>>(
    path: string,
    body: unknown,
  ): Promise<TPayload> {
    if (!this.baseUrl || !this.token) {
      throw new TechnicalError('La integración con el backend no está configurada.');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;
    try {
      response = await this.fetchFn(`${this.baseUrl}/internal/cms/company-profile/${path}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch {
      // Caída de red / timeout / abort: fail closed sin exponer detalles.
      throw new TechnicalError();
    } finally {
      clearTimeout(timer);
    }

    const data = (await this.safeJson(response)) as
      | { payload?: TPayload; message?: string; errors?: FieldError[] }
      | null;

    if (response.ok) {
      if (!data || data.payload === undefined) {
        throw new TechnicalError();
      }
      return data.payload;
    }

    // 4xx con contrato de negocio conocido → rechazo traducible.
    if (response.status >= 400 && response.status < 500 && data) {
      throw new BusinessRejectionError(
        typeof data.message === 'string' ? data.message : 'La operación fue rechazada.',
        response.status,
        Array.isArray(data.errors) ? data.errors : [],
      );
    }

    // 5xx u otros → técnico genérico.
    throw new TechnicalError();
  }

  private async safeJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
}
