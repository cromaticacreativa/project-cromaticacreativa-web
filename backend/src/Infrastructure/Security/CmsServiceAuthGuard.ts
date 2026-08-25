import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';

/**
 * Autenticación técnica service-to-service del CMS (Strapi) hacia los endpoints
 * internos de NestJS (`/internal/cms/*`).
 *
 * NO autentica personas: la autenticación humana pertenece exclusivamente a
 * Strapi. Este Guard solo verifica que quien llama es el proceso servidor de
 * Strapi, que envía `Authorization: Bearer <CMS_INTERNAL_TOKEN>`. El token vive
 * únicamente en el entorno del backend y del servidor de Strapi; nunca llega al
 * navegador ni se versiona.
 *
 * Es **fail closed**: si `CMS_INTERNAL_TOKEN` no está configurado, todas las
 * solicitudes se rechazan. La comparación del token es de tiempo constante y el
 * valor nunca se registra ni se devuelve.
 */
@Injectable()
export class CmsServiceAuthGuard implements CanActivate {
  public constructor(private readonly config: ConfigService) {}

  public canActivate(context: ExecutionContext): boolean {
    const token = this.config.get<string>('CMS_INTERNAL_TOKEN')?.trim();
    if (!token) {
      // Fail closed: sin secreto configurado, el endpoint interno no existe.
      throw new UnauthorizedException('El endpoint interno no está disponible.');
    }

    const request = context.switchToHttp().getRequest<{ headers?: Record<string, unknown> }>();
    const header = request.headers?.['authorization'];
    if (typeof header !== 'string' || header.length === 0) {
      throw new UnauthorizedException('Falta el encabezado de autorización.');
    }

    const separator = header.indexOf(' ');
    const scheme = separator === -1 ? header : header.slice(0, separator);
    const provided = separator === -1 ? '' : header.slice(separator + 1).trim();
    if (scheme !== 'Bearer' || provided.length === 0) {
      throw new UnauthorizedException('El esquema de autorización debe ser Bearer.');
    }

    if (!this.tokensCoinciden(provided, token)) {
      throw new UnauthorizedException('Token de servicio inválido.');
    }
    return true;
  }

  /** Comparación de tiempo constante; primero descarta por longitud. */
  private tokensCoinciden(provided: string, expected: string): boolean {
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }
}
