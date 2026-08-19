export type SubmitContactRequestDto = {
  firstName: string;
  lastName: string;
  companyName?: string | null;
  email: string;
  phone: string;
  tipoSolicitud: string;
  serviceId: string;
  message?: string | null;
};
