import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICompanyProfileStateReader } from '../../CompanyProfile.Application/Ports/ICompanyProfileStateReader';
import { CompanyContactInformation } from '../../CompanyProfile.Domain/Aggregates/CompanyContactInformation';
import { CompanyProfileMapper } from '../Persistence/Mappers/CompanyProfileMapper';
import { CompanyProfilePersistenceModel } from '../Persistence/Models/CompanyProfilePersistenceModel';

/**
 * Adaptador de solo lectura que reconstruye el Aggregate vigente de
 * CompanyProfile desde MySQL mediante TypeORM.
 *
 * Implementa exclusivamente lectura (`findOne`) del perfil singleton con sus
 * colecciones y lo traduce con `CompanyProfileMapper`. No expone ni ejecuta
 * `save`, `insert`, `update` o `delete`: la escritura final de una mutación
 * administrativa pertenece únicamente a Directus.
 */
export class CompanyProfileStateReader implements ICompanyProfileStateReader {
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
}
