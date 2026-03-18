import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { DformConfigEntity } from './dformConfig.entity';

@Entity('dform_version', { schema: 'allmap' })
export class DformVersionEntity {
  @PrimaryColumn({ name: 'form_version_id', type: 'integer' })
  formVersionId: number;

  @Column({ name: 'form_config_id', type: 'integer', nullable: true })
  formConfigId: number;

  @Column({ name: 'effective_date', type: 'date', nullable: true })
  effectiveDate: Date;

  @Column({ name: 'is_active', type: 'varchar', length: 1, nullable: true })
  isActive: string;

  @Column({ name: 'remark', type: 'varchar', length: 100, nullable: true })
  remark: string;

  @ManyToOne(() => DformConfigEntity)
  @JoinColumn({ name: 'form_config_id' })
  formConfig: DformConfigEntity;
}
