import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { PhonePersistenceDto } from '../../../CompanyProfile.Commons/DTOs/PhonePersistenceDto';
import { CompanyProfilePersistenceModel } from './CompanyProfilePersistenceModel';

@Entity({ name: 'phone' })
@Index('uq_phone_company_profile_id_number', ['companyProfileId', 'number'], { unique: true })
export class PhonePersistenceModel implements PhonePersistenceDto {
  @PrimaryColumn({ type: 'char', length: 36, charset: 'ascii', collation: 'ascii_bin' }) id!: string;
  @Column({ name: 'company_profile_id', type: 'char', length: 36, charset: 'ascii', collation: 'ascii_bin' })
  companyProfileId!: string;
  @Column({ type: 'varchar', length: 64 }) number!: string;
  @Column({ name: 'display_order', type: 'int', unsigned: true }) displayOrder!: number;
  @ManyToOne(() => CompanyProfilePersistenceModel, (profile) => profile.phones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_profile_id', foreignKeyConstraintName: 'fk_phone_company_profile' })
  companyProfile!: CompanyProfilePersistenceModel;
}
