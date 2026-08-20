import { ServiceCategoryPersistenceDto } from './ServiceCategoryPersistenceDto';

export type ServicePersistenceDto = {
  id: string;
  name: string;
  description: string;
  imageReference: string;
  status: string;
  displayOrder: number;
  categories?: readonly ServiceCategoryPersistenceDto[];
};
