import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { portfolioPersistenceModels } from './Portfolio.Infrastructure/Persistence/Configurations/PortfolioPersistenceConfiguration';

@Module({ imports: [TypeOrmModule.forFeature(portfolioPersistenceModels)] })
export class PortfolioModule {}
