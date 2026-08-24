import { CreateCompanyProfileSchema20260820000002 } from '../Migrations/CreateCompanyProfileSchema20260820000002';
import { CompanyProfilePersistenceModel } from '../Models/CompanyProfilePersistenceModel';
import { EmailPersistenceModel } from '../Models/EmailPersistenceModel';
import { LocationPersistenceModel } from '../Models/LocationPersistenceModel';
import { PhonePersistenceModel } from '../Models/PhonePersistenceModel';
import { SocialLinkPersistenceModel } from '../Models/SocialLinkPersistenceModel';

export const companyProfilePersistenceModels = [
  CompanyProfilePersistenceModel,
  PhonePersistenceModel,
  EmailPersistenceModel,
  LocationPersistenceModel,
  SocialLinkPersistenceModel,
];

export const companyProfileMigrations = [CreateCompanyProfileSchema20260820000002];
