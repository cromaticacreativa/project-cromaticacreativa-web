import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { SocialLinkPersistenceDto } from '../../../CompanyProfile.Commons/DTOs/SocialLinkPersistenceDto';
import { CompanyProfilePersistenceModel } from './CompanyProfilePersistenceModel';

@Entity({ name: 'social_link' })
@Index('uq_social_link_company_profile_id_network', ['companyProfileId', 'network'], { unique: true })
export class SocialLinkPersistenceModel implements SocialLinkPersistenceDto {
  @PrimaryColumn({ type: 'char', length: 36, charset: 'ascii', collation: 'ascii_bin' }) id!: string;
  @Column({ name: 'company_profile_id', type: 'char', length: 36, charset: 'ascii', collation: 'ascii_bin' })
  companyProfileId!: string;
  @Column({ type: 'varchar', length: 100 }) network!: string;
  @Column({ type: 'varchar', length: 2048 }) url!: string;
  @Column({ name: 'display_order', type: 'int', unsigned: true }) displayOrder!: number;
  @ManyToOne(() => CompanyProfilePersistenceModel, (profile) => profile.socialLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_profile_id', foreignKeyConstraintName: 'fk_social_link_company_profile' })
  companyProfile!: CompanyProfilePersistenceModel;
}
