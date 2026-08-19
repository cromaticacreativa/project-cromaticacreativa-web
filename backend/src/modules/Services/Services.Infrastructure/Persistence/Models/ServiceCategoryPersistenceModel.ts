import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ServiceCategoryPersistenceDto } from '../../../Services.Commons/DTOs/ServiceCategoryPersistenceDto';
import { ServicePersistenceModel } from './ServicePersistenceModel';

@Entity({ name: 'category' })
@Index('uq_category_service_id_name', ['serviceId', 'name'], { unique: true })
@Index('ix_category_status', ['status'])
@Index('ix_category_service_id_status', ['serviceId', 'status'])
export class ServiceCategoryPersistenceModel implements ServiceCategoryPersistenceDto {
  @PrimaryColumn({ type: 'char', length: 36, charset: 'ascii', collation: 'ascii_bin' }) id!: string;
  @Column({ name: 'service_id', type: 'char', length: 36, charset: 'ascii', collation: 'ascii_bin' }) serviceId!: string;
  @Column({ type: 'varchar', length: 200 }) name!: string;
  @Column({ type: 'text' }) description!: string;
  @Column({ name: 'reference_image', type: 'varchar', length: 2048 }) referenceImage!: string;
  @Column({ type: 'varchar', length: 16 }) status!: string;
  @Column({ name: 'display_order', type: 'int', unsigned: true }) displayOrder!: number;
  @ManyToOne(() => ServicePersistenceModel, (service) => service.categories, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'service_id', foreignKeyConstraintName: 'fk_category_service' })
  service!: ServicePersistenceModel;
}
