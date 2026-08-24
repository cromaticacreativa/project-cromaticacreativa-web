/** Payload canónico que el CMS persistirá en el singleton. */
export type AgregarCorreoReceptorResponseDto = {
  payload: {
    contact_request_recipient_email: string;
  };
};
