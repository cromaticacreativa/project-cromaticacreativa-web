import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MediaPersistenceDto } from '../../../Portfolio.Commons/DTOs/MediaPersistenceDto';
import { ProjectPersistenceModel } from './ProjectPersistenceModel';

@Entity({ name: 'media' })
@Index('ix_media_project_id', ['projectId'])
@Index('uq_media_project_cover', ['coverProjectId'], { unique: true })
export class MediaPersistenceModel implements MediaPersistenceDto {
  @PrimaryColumn({ type: 'char', length: 36, charset: 'ascii', collation: 'ascii_bin' }) id!: string;
  @Column({ name: 'project_id', type: 'char', length: 36, charset: 'ascii', collation: 'ascii_bin' }) projectId!: string;
  @Column({ type: 'varchar', length: 2048 }) reference!: string;
  @Column({ type: 'varchar', length: 16 }) type!: string;
  @Column({ name: 'display_order', type: 'int', unsigned: true }) displayOrder!: number;
  @Column({ name: 'is_cover', type: 'boolean', default: false }) isCover!: boolean;
  @Column({
    name: 'cover_project_id', type: 'char', length: 36, charset: 'ascii', collation: 'ascii_bin', nullable: true,
    asExpression: 'CASE WHEN `is_cover` = 1 THEN `project_id` ELSE NULL END', generatedType: 'STORED',
    select: false, insert: false, update: false,
  })
  coverProjectId!: string | null;
  @ManyToOne(() => ProjectPersistenceModel, (project) => project.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id', foreignKeyConstraintName: 'fk_media_project' })
  project!: ProjectPersistenceModel;
}
