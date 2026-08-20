import { Column, Entity, Index, OneToMany, OneToOne, PrimaryColumn } from 'typeorm';
import { CompanyProfilePersistenceDto } from '../../../CompanyProfile.Commons/DTOs/CompanyProfilePersistenceDto';
import { EmailPersistenceModel } from './EmailPersistenceModel';
import { LocationPersistenceModel } from './LocationPersistenceModel';
import { PhonePersistenceModel } from './PhonePersistenceModel';
import { SocialLinkPersistenceModel } from './SocialLinkPersistenceModel';

@Entity({ name: 'company_profile' })
@Index('uq_company_profile_singleton_key', ['singletonKey'], { unique: true })
export class CompanyProfilePersistenceModel implements CompanyProfilePersistenceDto {
  @PrimaryColumn({ type: 'char', length: 36, charset: 'ascii', collation: 'ascii_bin' }) id!: string;
  @Column({ name: 'singleton_key', type: 'tinyint', unsigned: true, default: 1 }) singletonKey!: number;
  @Column({ name: 'contact_request_recipient_email', type: 'varchar', length: 254 })
  contactRequestRecipientEmail!: string;
  @OneToMany(() => PhonePersistenceModel, (phone) => phone.companyProfile) phones!: PhonePersistenceModel[];
  @OneToMany(() => EmailPersistenceModel, (email) => email.companyProfile) emails!: EmailPersistenceModel[];
  @OneToOne(() => LocationPersistenceModel, (location) => location.companyProfile) location!: LocationPersistenceModel | null;
  @OneToMany(() => SocialLinkPersistenceModel, (link) => link.companyProfile) socialLinks!: SocialLinkPersistenceModel[];
}
