import { ScalarValueObject } from './Base/ScalarValueObject';
import { InvalidValueObjectException } from '../Exceptions/InvalidValueObjectException';

const LONGITUD_MAXIMA = 254;
const LONGITUD_MAXIMA_LOCAL = 64;
// Etiquetas de dominio no finales: alfanuméricas, sin `-` inicial/final.
const ETIQUETA_DOMINIO = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
// TLD (última etiqueta): solo letras, al menos 2 (rechaza `.c`, `.123`).
const TLD = /^[a-z]{2,}$/i;
const PARTE_LOCAL = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/i;

const MENSAJE_INVALIDO = 'La dirección de correo electrónico no es válida.';

/**
 * Correo electrónico. Autoridad de formato/longitud compartida por el correo
 * público y el correo receptor de solicitudes (misma regla para ambos).
 *
 * Exige `usuario@dominio.tld` con: un solo `@`; parte local no vacía y válida
 * (≤64); dominio con al menos dos etiquetas; etiquetas intermedias válidas; y un
 * **TLD de solo letras y ≥2 caracteres** (por eso se rechaza `gmail.c`). No valida
 * la existencia real del buzón (sin SMTP ni proveedor). El mensaje visible es el
 * mismo para los fallos estructurales; `reason` distingue el caso para que
 * Application pueda dar un mensaje más específico (p. ej. el correo receptor).
 */
export class EmailAddress extends ScalarValueObject<string> {
  public constructor(value: unknown) {
    if (value === null || value === undefined || typeof value !== 'string') {
      throw new InvalidValueObjectException('El correo electrónico es obligatorio.', 'obligatorio');
    }
    const normalized = value.trim();
    if (!normalized) throw new InvalidValueObjectException('El correo electrónico no puede estar vacío.', 'vacio');
    if (normalized.length > LONGITUD_MAXIMA) {
      throw new InvalidValueObjectException(`El correo electrónico no puede superar ${LONGITUD_MAXIMA} caracteres.`, 'longitud');
    }

    const parts = normalized.split('@');
    const local = parts[0] ?? '';
    const domain = parts[1] ?? '';

    // Estructura básica: exactamente un `@`, sin espacios, parte local válida y dominio presente.
    if (parts.length !== 2 || /\s/.test(normalized) || !local || local.length > LONGITUD_MAXIMA_LOCAL || !PARTE_LOCAL.test(local) || !domain) {
      throw new InvalidValueObjectException(MENSAJE_INVALIDO, 'formato');
    }

    const labels = domain.split('.');
    // Sin punto en el dominio → falta el TLD (por ejemplo, `contacto@gmail`).
    if (labels.length < 2) {
      throw new InvalidValueObjectException(MENSAJE_INVALIDO, 'dominio');
    }
    const tld = labels[labels.length - 1] ?? '';
    const restantes = labels.slice(0, -1);
    // Etiquetas intermedias vacías o inválidas (`gmail..com`, `.com`) → formato.
    if (restantes.some((label) => !ETIQUETA_DOMINIO.test(label))) {
      throw new InvalidValueObjectException(MENSAJE_INVALIDO, 'formato');
    }
    // TLD incompleto/ inválido (`gmail.c`, `gmail.`, `empresa.co2`).
    if (!TLD.test(tld)) {
      throw new InvalidValueObjectException(MENSAJE_INVALIDO, 'tld');
    }

    // Canonicalización: el dominio es insensible a mayúsculas y se normaliza a
    // minúsculas; la parte local se preserva porque puede ser sensible a
    // mayúsculas. No se aplican reglas específicas de proveedor (sin whitelist).
    super(`${local}@${domain.toLowerCase()}`);
  }
}
