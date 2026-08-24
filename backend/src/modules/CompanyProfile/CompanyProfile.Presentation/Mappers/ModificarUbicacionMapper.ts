import { ModificarUbicacionCommand } from '../../CompanyProfile.Application/Commands/ModificarUbicacion/ModificarUbicacionCommand';
import { IResultadoUbicacion } from '../../CompanyProfile.Application/Ports/IResultadoUbicacion';
import { ModificarUbicacionRequestDto } from '../DTOs/ModificarUbicacionRequestDto';
import { AgregarUbicacionResponseDto } from '../DTOs/AgregarUbicacionResponseDto';

/**
 * Traduce el update parcial de `location` de Directus al Command de HU25 y el
 * resultado canónico de vuelta. Solo se incluyen en el Command los campos
 * presentes en el payload; el Handler completa los ausentes con el valor actual.
 * La respuesta de update no incluye `company_profile_id` (no cambia).
 */
export class ModificarUbicacionMapper {
  public static toCommand(dto: ModificarUbicacionRequestDto): ModificarUbicacionCommand {
    const payload = dto.payload ?? {};
    const direccion = Object.prototype.hasOwnProperty.call(payload, 'address')
      ? this.texto(payload['address'])
      : undefined;
    const latitud = Object.prototype.hasOwnProperty.call(payload, 'latitude')
      ? this.numero(payload['latitude'])
      : undefined;
    const longitud = Object.prototype.hasOwnProperty.call(payload, 'longitude')
      ? this.numero(payload['longitude'])
      : undefined;
    return new ModificarUbicacionCommand(direccion, latitud, longitud);
  }

  public static toResponse(resultado: IResultadoUbicacion): AgregarUbicacionResponseDto {
    return {
      payload: {
        address: resultado.direccion,
        latitude: resultado.latitud,
        longitude: resultado.longitud,
      },
    };
  }

  private static texto(valor: unknown): string {
    return typeof valor === 'string' ? valor : '';
  }

  private static numero(valor: unknown): number {
    if (typeof valor === 'number') return valor;
    if (typeof valor === 'string' && valor.trim() !== '') return Number(valor);
    return Number.NaN;
  }
}
