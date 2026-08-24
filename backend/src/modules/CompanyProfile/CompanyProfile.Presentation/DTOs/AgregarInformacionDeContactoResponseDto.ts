/**
 * Contrato HTTP de salida del endpoint interno de HU22.
 *
 * `payload` contiene los valores canónicos aprobados con los nombres de columna
 * de negocio que el CMS persistirá (por ejemplo `number`, `address`, `network`,
 * `url`, `display_order`, `company_profile_id`). El CMS los fusiona en el
 * registro que finalmente inserta, garantizando que guarde exactamente el valor
 * que el backend validó y normalizó.
 */
export type AgregarInformacionDeContactoResponseDto = {
  payload: Record<string, unknown>;
};
