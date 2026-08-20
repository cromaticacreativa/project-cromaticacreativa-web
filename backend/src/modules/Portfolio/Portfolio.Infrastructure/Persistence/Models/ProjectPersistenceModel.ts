import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { ProjectPersistenceDto } from '../../../Portfolio.Commons/DTOs/ProjectPersistenceDto';
import { CorporateClientPersistenceModel } from './CorporateClientPersistenceModel';
import { MediaPersistenceModel } from './MediaPersistenceModel';

@Entity({ name: 'project' })
@Index('ix_project_publication_status', ['publicationStatus'])
@Index('ix_project_corporate_client_id', ['corporateClientId'])
@Index('ix_project_service_id', ['serviceId'])
@Index('ix_project_category_id', ['categoryId'])
@Index('ix_project_publication_status_service_id_category_id', ['publicationStatus', 'serviceId', 'categoryId'])
export class ProjectPersistenceModel implements ProjectPersistenceDto {
  @PrimaryColumn({ type: 'char', length: 36, charset: 'ascii', collation: 'ascii_bin' }) id!: string;
  @Column({ type: 'varchar', length: 300, nullable: true }) title!: string | null;
  @Column({ type: 'text' }) description!: string;
  @Column({ name: 'publication_status', type: 'varchar', length: 16 }) publicationStatus!: string;
  @Column({ name: 'display_order', type: 'int', unsigned: true }) displayOrder!: number;
  @Column({ name: 'corporate_client_id', type: 'char', length: 36, charset: 'ascii', collation: 'ascii_bin', nullable: true })
  corporateClientId!: string | null;
  @Column({ name: 'service_id', type: 'char', length: 36, charset: 'ascii', collation: 'ascii_bin' }) serviceId!: string;
  @Column({ name: 'category_id', type: 'char', length: 36, charset: 'ascii', collation: 'ascii_bin' }) categoryId!: string;
  @Column({ name: 'start_date', type: 'date' }) startDate!: string;
  @Column({ name: 'end_date', type: 'date' }) endDate!: string;
  @ManyToOne(() => CorporateClientPersistenceModel, (client) => client.projects, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'corporate_client_id', foreignKeyConstraintName: 'fk_project_corporate_client' })
  corporateClient!: CorporateClientPersistenceModel | null;
  @OneToMany(() => MediaPersistenceModel, (media) => media.project, { cascade: false })
  media!: MediaPersistenceModel[];
}
