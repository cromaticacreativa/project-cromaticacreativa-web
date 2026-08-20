import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CmsInternalAuthGuard } from '../../Infrastructure/Security/CmsInternalAuthGuard';
import { AgregarInformacionDeContactoCommandHandler } from './CompanyProfile.Application/Commands/AgregarInformacionDeContacto/AgregarInformacionDeContactoCommandHandler';
import { AgregarUbicacionCommandHandler } from './CompanyProfile.Application/Commands/AgregarUbicacion/AgregarUbicacionCommandHandler';
import { ValidarCorreoReceptorCommandHandler } from './CompanyProfile.Application/Commands/ValidarCorreoReceptor/ValidarCorreoReceptorCommandHandler';
import { AgregarCorreoStrategy } from './CompanyProfile.Application/Strategies/AgregarCorreoStrategy';
import { AgregarRedSocialStrategy } from './CompanyProfile.Application/Strategies/AgregarRedSocialStrategy';
import { AgregarTelefonoStrategy } from './CompanyProfile.Application/Strategies/AgregarTelefonoStrategy';
import { AGREGAR_INFORMACION_DE_CONTACTO_STRATEGIES } from './CompanyProfile.Application/Ports/IAgregarInformacionDeContactoStrategy';
import { COMPANY_PROFILE_STATE_READER } from './CompanyProfile.Application/Ports/ICompanyProfileStateReader';
import { ValidadoraTelefono } from './CompanyProfile.Application/Validations/ValidadoraTelefono';
import { companyProfilePersistenceModels } from './CompanyProfile.Infrastructure/Persistence/Configurations/CompanyProfilePersistenceConfiguration';
import { CompanyProfileStateReader } from './CompanyProfile.Infrastructure/Adapters/CompanyProfileStateReader';
import { CompanyProfileCmsController } from './CompanyProfile.Presentation/Controllers/CompanyProfileCmsController';

@Module({
  imports: [TypeOrmModule.forFeature(companyProfilePersistenceModels)],
  controllers: [CompanyProfileCmsController],
  providers: [
    CmsInternalAuthGuard,
    ValidadoraTelefono,
    AgregarTelefonoStrategy,
    AgregarCorreoStrategy,
    AgregarRedSocialStrategy,
    {
      provide: AGREGAR_INFORMACION_DE_CONTACTO_STRATEGIES,
      useFactory: (
        telefono: AgregarTelefonoStrategy,
        correo: AgregarCorreoStrategy,
        redSocial: AgregarRedSocialStrategy,
      ) => [telefono, correo, redSocial],
      inject: [AgregarTelefonoStrategy, AgregarCorreoStrategy, AgregarRedSocialStrategy],
    },
    AgregarInformacionDeContactoCommandHandler,
    AgregarUbicacionCommandHandler,
    ValidarCorreoReceptorCommandHandler,
    { provide: COMPANY_PROFILE_STATE_READER, useClass: CompanyProfileStateReader },
  ],
})
export class CompanyProfileModule {}
