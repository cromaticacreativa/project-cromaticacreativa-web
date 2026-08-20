/** Payload canónico que Directus persistirá en el singleton. */
export type AgregarCorreoReceptorResponseDto = {
  payload: {
    contact_request_recipient_email: string;
  };
};
