/**
 * Contrato HTTP de entrada del endpoint interno de HU24.
 *
 * Modela lo que el CMS administrativo envía a NestJS al crear la ubicación:
 * la colección técnica de origen y el payload propuesto. Es un contrato de
 * transporte; su traducción a vocabulario de negocio ocurre en el Mapper de
 * Presentation, no en Application ni en Domain.
 */
export type AgregarUbicacionRequestDto = {
  collection: string;
  payload: Record<string, unknown>;
};
