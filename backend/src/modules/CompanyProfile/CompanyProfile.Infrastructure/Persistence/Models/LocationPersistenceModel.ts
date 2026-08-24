import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { LocationPersistenceDto } from '../../../CompanyProfile.Commons/DTOs/LocationPersistenceDto';
import { CompanyProfilePersistenceModel } from './CompanyProfilePersistenceModel';

@Entity({ name: 'location' })
export class LocationPersistenceModel implements LocationPersistenceDto {
  @PrimaryColumn({ name: 'company_profile_id', type: 'char', length: 36, charset: 'ascii', collation: 'ascii_bin' })
  companyProfileId!: string;
  @Column({ type: 'varchar', length: 500 }) address!: string;
  @Column({ type: 'double' }) latitude!: number;
  @Column({ type: 'double' }) longitude!: number;
  @OneToOne(() => CompanyProfilePersistenceModel, (profile) => profile.location, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_profile_id', foreignKeyConstraintName: 'fk_location_company_profile' })
  companyProfile!: CompanyProfilePersistenceModel;
}
