import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CmsServiceAuthGuard } from '../../Infrastructure/Security/CmsServiceAuthGuard';
import { AgregarInformacionDeContactoCommandHandler } from './CompanyProfile.Application/Commands/AgregarInformacionDeContacto/AgregarInformacionDeContactoCommandHandler';
import { AgregarUbicacionCommandHandler } from './CompanyProfile.Application/Commands/AgregarUbicacion/AgregarUbicacionCommandHandler';
import { InicializarCompanyProfileCommandHandler } from './CompanyProfile.Application/Commands/InicializarCompanyProfile/InicializarCompanyProfileCommandHandler';
import { ModificarInformacionDeContactoCommandHandler } from './CompanyProfile.Application/Commands/ModificarInformacionDeContacto/ModificarInformacionDeContactoCommandHandler';
import { ModificarUbicacionCommandHandler } from './CompanyProfile.Application/Commands/ModificarUbicacion/ModificarUbicacionCommandHandler';
import { AgregarCorreoStrategy } from './CompanyProfile.Application/Strategies/AgregarCorreoStrategy';
import { AgregarCorreoReceptorStrategy } from './CompanyProfile.Application/Strategies/AgregarCorreoReceptorStrategy';
import { AgregarRedSocialStrategy } from './CompanyProfile.Application/Strategies/AgregarRedSocialStrategy';
import { AgregarTelefonoStrategy } from './CompanyProfile.Application/Strategies/AgregarTelefonoStrategy';
import { ModificarTelefonoStrategy } from './CompanyProfile.Application/Strategies/ModificarTelefonoStrategy';
import { ModificarCorreoStrategy } from './CompanyProfile.Application/Strategies/ModificarCorreoStrategy';
import { ModificarRedSocialStrategy } from './CompanyProfile.Application/Strategies/ModificarRedSocialStrategy';
import { AGREGAR_INFORMACION_DE_CONTACTO_STRATEGIES } from './CompanyProfile.Application/Ports/IAgregarInformacionDeContactoStrategy';
import { MODIFICAR_INFORMACION_DE_CONTACTO_STRATEGIES } from './CompanyProfile.Application/Ports/IModificarInformacionDeContactoStrategy';
import { COMPANY_PROFILE_STATE_READER } from './CompanyProfile.Application/Ports/ICompanyProfileStateReader';
import { CHILD_ACTUAL_READER } from './CompanyProfile.Application/Ports/IChildActualReader';
import { ValidadoraTelefono } from './CompanyProfile.Application/Validations/ValidadoraTelefono';
import { ValidadoraCorreo } from './CompanyProfile.Application/Validations/ValidadoraCorreo';
import { ValidadoraRedSocial } from './CompanyProfile.Application/Validations/ValidadoraRedSocial';
import { companyProfilePersistenceModels } from './CompanyProfile.Infrastructure/Persistence/Configurations/CompanyProfilePersistenceConfiguration';
import { CompanyProfileStateReader } from './CompanyProfile.Infrastructure/Adapters/CompanyProfileStateReader';
import { CompanyProfileCmsController } from './CompanyProfile.Presentation/Controllers/CompanyProfileCmsController';

/**
 * Módulo de CompanyProfile.
 *
 * La frontera HTTP interna `CompanyProfileCmsController` (`/internal/cms/company-profile/*`)
 * está registrada y protegida por `CmsServiceAuthGuard` (token técnico
 * service-to-service Strapi → NestJS). Solo expone CREATE/UPDATE administrativos;
 * GET y DELETE los resuelve Strapi directo a MySQL. NestJS es la autoridad de
 * reglas de negocio y devuelve el payload canónico; Strapi ejecuta la escritura
 * final. Las TypeORM migrations gobiernan el schema de negocio (ADR-027).
 */
@Module({
  imports: [TypeOrmModule.forFeature(companyProfilePersistenceModels)],
  controllers: [CompanyProfileCmsController],
  providers: [
    CmsServiceAuthGuard,
    ValidadoraTelefono,
    ValidadoraCorreo,
    ValidadoraRedSocial,
    AgregarTelefonoStrategy,
    AgregarCorreoStrategy,
    AgregarCorreoReceptorStrategy,
    AgregarRedSocialStrategy,
    ModificarTelefonoStrategy,
    ModificarCorreoStrategy,
    ModificarRedSocialStrategy,
    {
      provide: AGREGAR_INFORMACION_DE_CONTACTO_STRATEGIES,
      useFactory: (
        telefono: AgregarTelefonoStrategy,
        correo: AgregarCorreoStrategy,
        correoReceptor: AgregarCorreoReceptorStrategy,
        redSocial: AgregarRedSocialStrategy,
      ) => [telefono, correo, correoReceptor, redSocial],
      inject: [
        AgregarTelefonoStrategy,
        AgregarCorreoStrategy,
        AgregarCorreoReceptorStrategy,
        AgregarRedSocialStrategy,
      ],
    },
    {
      provide: MODIFICAR_INFORMACION_DE_CONTACTO_STRATEGIES,
      useFactory: (
        telefono: ModificarTelefonoStrategy,
        correo: ModificarCorreoStrategy,
        redSocial: ModificarRedSocialStrategy,
      ) => [telefono, correo, redSocial],
      inject: [ModificarTelefonoStrategy, ModificarCorreoStrategy, ModificarRedSocialStrategy],
    },
    AgregarInformacionDeContactoCommandHandler,
    AgregarUbicacionCommandHandler,
    ModificarInformacionDeContactoCommandHandler,
    ModificarUbicacionCommandHandler,
    InicializarCompanyProfileCommandHandler,
    // El mismo adaptador cubre ambos puertos de lectura (estado + valor actual por id).
    CompanyProfileStateReader,
    { provide: COMPANY_PROFILE_STATE_READER, useExisting: CompanyProfileStateReader },
    { provide: CHILD_ACTUAL_READER, useExisting: CompanyProfileStateReader },
  ],
})
export class CompanyProfileModule {}
