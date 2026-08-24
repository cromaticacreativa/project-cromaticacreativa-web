/** Contrato HTTP que Directus envía al actualizar el correo receptor. */
export type AgregarCorreoReceptorRequestDto = {
  collection?: string;
  payload?: Record<string, unknown>;
};
