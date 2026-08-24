import { Column, Entity, Index, OneToMany, PrimaryColumn } from 'typeorm';
import { ServicePersistenceDto } from '../../../Services.Commons/DTOs/ServicePersistenceDto';
import { ServiceCategoryPersistenceModel } from './ServiceCategoryPersistenceModel';

@Entity({ name: 'service' })
@Index('uq_service_name', ['name'], { unique: true })
@Index('ix_service_status', ['status'])
export class ServicePersistenceModel implements ServicePersistenceDto {
  @PrimaryColumn({ type: 'char', length: 36, charset: 'ascii', collation: 'ascii_bin' }) id!: string;
  @Column({ type: 'varchar', length: 200 }) name!: string;
  @Column({ type: 'text' }) description!: string;
  @Column({ name: 'image_reference', type: 'varchar', length: 2048 }) imageReference!: string;
  @Column({ type: 'varchar', length: 16 }) status!: string;
  @Column({ name: 'display_order', type: 'int', unsigned: true }) displayOrder!: number;
  @OneToMany(() => ServiceCategoryPersistenceModel, (category) => category.service)
  categories!: ServiceCategoryPersistenceModel[];
}
