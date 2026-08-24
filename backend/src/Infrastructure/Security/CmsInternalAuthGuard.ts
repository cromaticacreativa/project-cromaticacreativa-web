import { timingSafeEqual } from 'node:crypto';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const CMS_INTERNAL_TOKEN = 'CMS_INTERNAL_TOKEN';
const BEARER_SCHEME = 'Bearer';

/**
 * Protege los endpoints internos `/internal/cms/*` de la autenticación técnica
 * Directus → NestJS (ADR-023).
 *
 * Exige `Authorization: Bearer <token>` y compara el token con
 * `CMS_INTERNAL_TOKEN` mediante una comparación de tiempo constante. Es "fail
 * closed": si el secreto no está configurado, rechaza todas las solicitudes, de
 * modo que el endpoint interno queda inaccesible en lugar de abierto. Nunca
 * registra el token ni lo incluye en mensajes de error.
 */
@Injectable()
export class CmsInternalAuthGuard implements CanActivate {
  public constructor(private readonly configuration: ConfigService) {}

  public canActivate(context: ExecutionContext): boolean {
    const expected = this.configuration.get<string>(CMS_INTERNAL_TOKEN)?.trim();
    if (!expected) {
      throw new UnauthorizedException('El acceso interno del CMS no está configurado.');
    }

    const request = context.switchToHttp().getRequest<{ headers?: Record<string, unknown> }>();
    const header = request.headers?.['authorization'];
    if (typeof header !== 'string') {
      throw new UnauthorizedException('Falta el encabezado de autorización.');
    }

    const separator = header.indexOf(' ');
    const scheme = separator > 0 ? header.slice(0, separator) : header;
    const token = separator > 0 ? header.slice(separator + 1).trim() : '';
    if (scheme !== BEARER_SCHEME || !token) {
      throw new UnauthorizedException('El esquema de autorización debe ser Bearer.');
    }

    if (!this.tokensEquivalentes(token, expected)) {
      throw new UnauthorizedException('Credencial interna inválida.');
    }
    return true;
  }

  private tokensEquivalentes(recibido: string, esperado: string): boolean {
    const recibidoBuffer = Buffer.from(recibido, 'utf8');
    const esperadoBuffer = Buffer.from(esperado, 'utf8');
    if (recibidoBuffer.length !== esperadoBuffer.length) return false;
    return timingSafeEqual(recibidoBuffer, esperadoBuffer);
  }
}
