import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IChildActualReader } from '../../CompanyProfile.Application/Ports/IChildActualReader';
import { ICompanyProfileStateReader } from '../../CompanyProfile.Application/Ports/ICompanyProfileStateReader';
import { CompanyContactInformation } from '../../CompanyProfile.Domain/Aggregates/CompanyContactInformation';
import { CompanyProfileMapper } from '../Persistence/Mappers/CompanyProfileMapper';
import { CompanyProfilePersistenceModel } from '../Persistence/Models/CompanyProfilePersistenceModel';
import { EmailPersistenceModel } from '../Persistence/Models/EmailPersistenceModel';
import { PhonePersistenceModel } from '../Persistence/Models/PhonePersistenceModel';
import { SocialLinkPersistenceModel } from '../Persistence/Models/SocialLinkPersistenceModel';

/**
 * Adaptador de solo lectura que reconstruye el Aggregate vigente de
 * CompanyProfile desde MySQL mediante TypeORM, y además resuelve el valor único
 * ACTUAL de un child por su id (para HU23: modificar el elemento correcto sin que
 * el Domain conozca ids).
 *
 * Implementa exclusivamente lectura (`findOne`). No expone ni ejecuta `save`,
 * `insert`, `update` o `delete`: la escritura final de una mutación administrativa
 * pertenece únicamente a Directus.
 */
export class CompanyProfileStateReader implements ICompanyProfileStateReader, IChildActualReader {
  public constructor(
    @InjectRepository(CompanyProfilePersistenceModel)
    private readonly repository: Repository<CompanyProfilePersistenceModel>,
  ) {}

  public async leerInformacionDeContacto(): Promise<CompanyContactInformation | null> {
    const model = await this.repository.findOne({
      where: { singletonKey: 1 },
      relations: { phones: true, emails: true, socialLinks: true, location: true },
    });
    return model ? CompanyProfileMapper.toDomain(model) : null;
  }

  /** Id del perfil singleton; se usa para acotar las lecturas de children. */
  private async idDelSingleton(): Promise<string | null> {
    const perfil = await this.repository.findOne({ where: { singletonKey: 1 }, select: { id: true } });
    return perfil ? perfil.id : null;
  }

  public async leerTelefonoActual(id: string): Promise<string | null> {
    const companyProfileId = await this.idDelSingleton();
    if (!companyProfileId) return null;
    const row = await this.repository.manager.getRepository(PhonePersistenceModel).findOne({ where: { id, companyProfileId } });
    return row ? row.number : null;
  }

  public async leerCorreoActual(id: string): Promise<string | null> {
    const companyProfileId = await this.idDelSingleton();
    if (!companyProfileId) return null;
    const row = await this.repository.manager.getRepository(EmailPersistenceModel).findOne({ where: { id, companyProfileId } });
    return row ? row.address : null;
  }

  public async leerRedSocialActual(id: string): Promise<string | null> {
    const companyProfileId = await this.idDelSingleton();
    if (!companyProfileId) return null;
    const row = await this.repository.manager.getRepository(SocialLinkPersistenceModel).findOne({ where: { id, companyProfileId } });
    return row ? row.network : null;
  }
}
