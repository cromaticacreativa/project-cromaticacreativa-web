import { AgregarUbicacionCommand } from '../../CompanyProfile.Application/Commands/AgregarUbicacion/AgregarUbicacionCommand';
import { IResultadoUbicacion } from '../../CompanyProfile.Application/Ports/IResultadoUbicacion';
import { AgregarUbicacionRequestDto } from '../DTOs/AgregarUbicacionRequestDto';
import { AgregarUbicacionResponseDto } from '../DTOs/AgregarUbicacionResponseDto';

/** Colección de Directus que HU24 intercepta para creación. */
export const COLECCION_UBICACION = 'location';

/**
 * Traduce la frontera técnica de Directus (payload de `location`) hacia el
 * vocabulario del caso de uso y traduce el resultado canónico de vuelta al
 * payload técnico que Directus persiste.
 *
 * Presentation es la única capa que conoce los nombres de columna (`address`,
 * `latitude`, `longitude`, `company_profile_id`); Application usa `direccion`,
 * `latitud`, `longitud`. El Mapper no contiene reglas de negocio: no valida
 * rangos geográficos ni la dirección (eso vive en Domain); solo extrae y traduce.
 */
export class AgregarUbicacionMapper {
  public static toCommand(dto: AgregarUbicacionRequestDto): AgregarUbicacionCommand {
    const payload = dto.payload ?? {};
    return new AgregarUbicacionCommand(
      this.texto(payload, 'address'),
      this.numero(payload, 'latitude'),
      this.numero(payload, 'longitude'),
    );
  }

  public static toResponse(resultado: IResultadoUbicacion): AgregarUbicacionResponseDto {
    return {
      payload: {
        company_profile_id: resultado.companyProfileId,
        address: resultado.direccion,
        latitude: resultado.latitud,
        longitude: resultado.longitud,
      },
    };
  }

  private static texto(payload: Record<string, unknown>, clave: string): string {
    const valor = payload[clave];
    return typeof valor === 'string' ? valor : '';
  }

  private static numero(payload: Record<string, unknown>, clave: string): number {
    const valor = payload[clave];
    if (typeof valor === 'number') return valor;
    if (typeof valor === 'string' && valor.trim() !== '') return Number(valor);
    return Number.NaN;
  }
}
