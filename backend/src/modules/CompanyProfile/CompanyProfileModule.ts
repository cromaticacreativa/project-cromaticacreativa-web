import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgregarInformacionDeContactoCommandHandler } from './CompanyProfile.Application/Commands/AgregarInformacionDeContacto/AgregarInformacionDeContactoCommandHandler';
import { AgregarUbicacionCommandHandler } from './CompanyProfile.Application/Commands/AgregarUbicacion/AgregarUbicacionCommandHandler';
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

/**
 * Módulo de CompanyProfile.
 *
 * La lógica de negocio administrativa (Commands, Handlers, Strategies,
 * Validadoras y el puerto de lectura) permanece registrada y compilable. La
 * frontera HTTP interna `CompanyProfileCmsController` NO se registra en esta
 * fase: la integración administrativa migró de Directus a Strapi y la
 * autenticación service-to-service Strapi → NestJS se implementará en una tarea
 * posterior. Hasta entonces el controller no se expone sin protección. El
 * archivo del controller se conserva como código de migración desacoplado del
 * CMS anterior.
 */
@Module({
  imports: [TypeOrmModule.forFeature(companyProfilePersistenceModels)],
  providers: [
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
    // El mismo adaptador cubre ambos puertos de lectura (estado + valor actual por id).
    CompanyProfileStateReader,
    { provide: COMPANY_PROFILE_STATE_READER, useExisting: CompanyProfileStateReader },
    { provide: CHILD_ACTUAL_READER, useExisting: CompanyProfileStateReader },
  ],
})
export class CompanyProfileModule {}
