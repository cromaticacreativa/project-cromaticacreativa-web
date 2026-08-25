/**
 * Contrato HTTP de entrada del endpoint interno de inicialización del perfil.
 * El CMS envía el correo receptor propuesto; su validación ocurre en NestJS.
 */
export type InicializarCompanyProfileRequestDto = {
  payload?: Record<string, unknown>;
};
