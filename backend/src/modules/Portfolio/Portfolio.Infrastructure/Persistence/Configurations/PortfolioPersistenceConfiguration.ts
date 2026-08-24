import { CreatePortfolioSchema20260820000000 } from '../Migrations/CreatePortfolioSchema20260820000000';
import { CorporateClientPersistenceModel } from '../Models/CorporateClientPersistenceModel';
import { MediaPersistenceModel } from '../Models/MediaPersistenceModel';
import { ProjectPersistenceModel } from '../Models/ProjectPersistenceModel';

export const portfolioPersistenceModels = [
  CorporateClientPersistenceModel,
  ProjectPersistenceModel,
  MediaPersistenceModel,
];

export const portfolioMigrations = [CreatePortfolioSchema20260820000000];
