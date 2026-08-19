import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyProfileModule } from './modules/CompanyProfile/CompanyProfileModule';
import { ContactModule } from './modules/Contact/ContactModule';
import { getDatabaseConfiguration } from './Infrastructure/Configuration/DatabaseConfiguration';
import { PortfolioModule } from './modules/Portfolio/PortfolioModule';
import { ServicesModule } from './modules/Services/ServicesModule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CqrsModule.forRoot(),
    TypeOrmModule.forRootAsync({ useFactory: () => getDatabaseConfiguration() }),
    PortfolioModule,
    ServicesModule,
    CompanyProfileModule,
    ContactModule,
  ],
})
export class AppModule {}
