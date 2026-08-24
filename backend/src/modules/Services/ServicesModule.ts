import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { servicesPersistenceModels } from './Services.Infrastructure/Persistence/Configurations/ServicesPersistenceConfiguration';

@Module({ imports: [TypeOrmModule.forFeature(servicesPersistenceModels)] })
export class ServicesModule {}
