/**
 * Contrato HTTP de salida del endpoint interno de HU24.
 *
 * `payload` contiene los valores canónicos aprobados con los nombres de columna
 * que Directus persistirá (`company_profile_id`, `address`, `latitude`,
 * `longitude`). El Filter Hook los fusiona en el registro que finalmente inserta,
 * garantizando que Directus guarde exactamente lo que NestJS validó. El
 * `company_profile_id` procede del perfil singleton reconstruido por el backend.
 */
export type AgregarUbicacionResponseDto = {
  payload: Record<string, unknown>;
};
