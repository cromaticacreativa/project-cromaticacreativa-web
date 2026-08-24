/**
 * Contrato HTTP de entrada del endpoint interno de HU22.
 *
 * Modela lo que el CMS administrativo envía a NestJS: la colección técnica
 * de origen y el payload propuesto para la creación. Es un contrato de
 * transporte; su traducción a vocabulario de negocio ocurre en el Mapper de
 * Presentation, no en Application ni en Domain.
 */
export type AgregarInformacionDeContactoRequestDto = {
  collection: string;
  payload: Record<string, unknown>;
};
