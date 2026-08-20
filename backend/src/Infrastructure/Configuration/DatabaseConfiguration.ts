import type { DataSourceOptions } from 'typeorm';
import {
  companyProfileMigrations,
  companyProfilePersistenceModels,
} from '../../modules/CompanyProfile/CompanyProfile.Infrastructure/Persistence/Configurations/CompanyProfilePersistenceConfiguration';
import {
  portfolioMigrations,
  portfolioPersistenceModels,
} from '../../modules/Portfolio/Portfolio.Infrastructure/Persistence/Configurations/PortfolioPersistenceConfiguration';
import {
  servicesMigrations,
  servicesPersistenceModels,
} from '../../modules/Services/Services.Infrastructure/Persistence/Configurations/ServicesPersistenceConfiguration';

function required(environment: NodeJS.ProcessEnv, name: string): string {
  const value = environment[name]?.trim();
  if (!value) throw new Error(`Falta la variable de entorno obligatoria '${name}'.`);
  return value;
}

export function getDatabaseConfiguration(environment: NodeJS.ProcessEnv = process.env): DataSourceOptions {
  const port = Number(required(environment, 'MYSQL_PORT'));
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('MYSQL_PORT debe ser un puerto TCP válido.');
  }

  return {
    type: 'mysql',
    host: required(environment, 'MYSQL_HOST'),
    port,
    database: required(environment, 'MYSQL_DATABASE'),
    username: required(environment, 'MYSQL_USER'),
    password: required(environment, 'MYSQL_PASSWORD'),
    charset: 'utf8mb4',
    timezone: 'Z',
    extra: { dateStrings: ['DATE'] },
    entities: [
      ...portfolioPersistenceModels,
      ...servicesPersistenceModels,
      ...companyProfilePersistenceModels,
    ],
    migrations: [
      ...portfolioMigrations,
      ...servicesMigrations,
      ...companyProfileMigrations,
    ],
    migrationsTableName: 'typeorm_migration',
    synchronize: false,
    logging: false,
  };
}
