import { ExternalUrl } from '../../CompanyProfile.Domain/ValueObjects/ExternalUrl';
import { SocialLink } from '../../CompanyProfile.Domain/ValueObjects/SocialLink';
import { InformacionDeContactoRechazadaException } from '../Exceptions/InformacionDeContactoRechazadaException';
import { IValidadora } from '../Ports/IValidadora';
import { IValidationError } from '../Ports/IValidationError';

/**
 * URL válida de sondeo para aislar la validación de la red (`network`) cuando la
 * URL real es inválida, y así acumular ambos errores. No se persiste: el enlace
 * definitivo se construye con la URL real.
 */
const URL_DE_SONDEO = new ExternalUrl('https://example.com');

/**
 * Valida `red` + `url` reutilizando las invariantes de `SocialLink`/`ExternalUrl`
 * (sin duplicar reglas) y acumula ambos errores de la misma operación. La usan por
 * igual Agregar y Modificar red social, de modo que la validación es idéntica.
 */
export class ValidadoraRedSocial implements IValidadora<Readonly<Record<string, unknown>>, SocialLink> {
  public validar(datos: Readonly<Record<string, unknown>>): SocialLink {
    const errores: IValidationError[] = [];
    const errorRed = InformacionDeContactoRechazadaException.capturarCampo(
      'red',
      () => new SocialLink(datos['red'], URL_DE_SONDEO),
    );
    if (errorRed) errores.push(errorRed);
    const errorUrl = InformacionDeContactoRechazadaException.capturarCampo(
      'url',
      () => new ExternalUrl(datos['url']),
    );
    if (errorUrl) errores.push(errorUrl);
    if (errores.length > 0) {
      throw InformacionDeContactoRechazadaException.acumulada(errores);
    }
    return new SocialLink(datos['red'], new ExternalUrl(datos['url']));
  }
}
