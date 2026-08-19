import { CreateServicesSchema20260820000001 } from '../Migrations/CreateServicesSchema20260820000001';
import { ServiceCategoryPersistenceModel } from '../Models/ServiceCategoryPersistenceModel';
import { ServicePersistenceModel } from '../Models/ServicePersistenceModel';

export const servicesPersistenceModels = [ServicePersistenceModel, ServiceCategoryPersistenceModel];
export const servicesMigrations = [CreateServicesSchema20260820000001];
