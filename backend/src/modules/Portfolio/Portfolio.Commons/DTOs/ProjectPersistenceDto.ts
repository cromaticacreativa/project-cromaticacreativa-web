import { MediaPersistenceDto } from './MediaPersistenceDto';

export type ProjectPersistenceDto = {
  id: string;
  title: string | null;
  description: string;
  publicationStatus: string;
  displayOrder: number;
  corporateClientId: string | null;
  serviceId: string;
  categoryId: string;
  startDate: string;
  endDate: string;
  media?: readonly MediaPersistenceDto[];
};
