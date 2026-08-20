import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { companyProfilePersistenceModels } from './CompanyProfile.Infrastructure/Persistence/Configurations/CompanyProfilePersistenceConfiguration';

@Module({ imports: [TypeOrmModule.forFeature(companyProfilePersistenceModels)] })
export class CompanyProfileModule {}
