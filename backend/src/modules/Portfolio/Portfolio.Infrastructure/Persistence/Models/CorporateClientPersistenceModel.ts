import { Column, Entity, Index, OneToMany, PrimaryColumn } from 'typeorm';
import { CorporateClientPersistenceDto } from '../../../Portfolio.Commons/DTOs/CorporateClientPersistenceDto';
import { ProjectPersistenceModel } from './ProjectPersistenceModel';

@Entity({ name: 'corporate_client' })
@Index('uq_corporate_client_name', ['name'], { unique: true })
@Index('ix_corporate_client_visibility_status', ['visibilityStatus'])
export class CorporateClientPersistenceModel implements CorporateClientPersistenceDto {
  @PrimaryColumn({ type: 'char', length: 36, charset: 'ascii', collation: 'ascii_bin' }) id!: string;
  @Column({ type: 'varchar', length: 200 }) name!: string;
  @Column({ name: 'logo_reference', type: 'varchar', length: 2048 }) logoReference!: string;
  @Column({ name: 'visibility_status', type: 'varchar', length: 16 }) visibilityStatus!: string;
  @OneToMany(() => ProjectPersistenceModel, (project) => project.corporateClient)
  projects!: ProjectPersistenceModel[];
}
