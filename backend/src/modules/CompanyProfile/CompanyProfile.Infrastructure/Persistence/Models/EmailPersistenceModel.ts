import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { EmailPersistenceDto } from '../../../CompanyProfile.Commons/DTOs/EmailPersistenceDto';
import { CompanyProfilePersistenceModel } from './CompanyProfilePersistenceModel';

@Entity({ name: 'email' })
@Index('uq_email_company_profile_id_address', ['companyProfileId', 'address'], { unique: true })
export class EmailPersistenceModel implements EmailPersistenceDto {
  @PrimaryColumn({ type: 'char', length: 36, charset: 'ascii', collation: 'ascii_bin' }) id!: string;
  @Column({ name: 'company_profile_id', type: 'char', length: 36, charset: 'ascii', collation: 'ascii_bin' })
  companyProfileId!: string;
  @Column({ type: 'varchar', length: 254 }) address!: string;
  @Column({ name: 'display_order', type: 'int', unsigned: true }) displayOrder!: number;
  @ManyToOne(() => CompanyProfilePersistenceModel, (profile) => profile.emails, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_profile_id', foreignKeyConstraintName: 'fk_email_company_profile' })
  companyProfile!: CompanyProfilePersistenceModel;
}
