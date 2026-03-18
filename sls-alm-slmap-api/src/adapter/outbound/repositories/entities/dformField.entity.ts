import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { DformVersionEntity } from './dformVersion.entity';

@Entity('dform_field', { schema: 'allmap' })
@Index('idx_dform_field_form_version_id_seq', ['formVersionId', 'seq'])
export class DformFieldEntity {
  @PrimaryColumn({ name: 'field_id', type: 'integer' })
  fieldId: number;

  @Column({ name: 'form_version_id', type: 'integer', nullable: true })
  formVersionId: number;

  @Column({ name: 'field_name', type: 'varchar', length: 50, nullable: true })
  fieldName: string;

  @Column({ name: 'title', type: 'varchar', length: 50, nullable: true })
  title: string;

  @Column({ name: 'data_type', type: 'varchar', length: 50, nullable: true })
  dataType: string;

  @Column({ name: 'value_format', type: 'varchar', length: 50, nullable: true })
  valueFormat: string;

  @Column({ name: 'input_type', type: 'varchar', length: 50, nullable: true })
  inputType: string;

  @Column({ name: 'list_value', type: 'varchar', length: 50, nullable: true })
  listValue: string;

  @Column({ name: 'seq', type: 'integer', nullable: true })
  seq: number;

  @Column({ name: 'parent_field_id', type: 'integer', nullable: true })
  parentFieldId: number;

  @Column({ name: 'show_if_parent_value', type: 'varchar', length: 50, nullable: true })
  showIfParentValue: string;

  @Column({
    name: 'enabled_if_parent_value',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  enabledIfParentValue: string;

  @Column({ name: 'is_locked', type: 'boolean', nullable: true })
  isLocked: boolean;

  @Column({ name: 'field_group', type: 'varchar', length: 50, nullable: true })
  fieldGroup: string;

  @Column({ name: 'is_required', type: 'boolean', nullable: true })
  isRequired: boolean;

  @Column({ name: 'validate_min', type: 'integer', nullable: true })
  validateMin: number;

  @Column({ name: 'validate_max', type: 'integer', nullable: true })
  validateMax: number;

  @Column({ name: 'validate_regex', type: 'varchar', length: 50, nullable: true })
  validateRegex: string;

  @Column({ name: 'has_other', type: 'boolean', nullable: true })
  hasOther: boolean;

  @Column({ name: 'is_show_percent', type: 'boolean', nullable: true })
  isShowPercent: boolean;

  @Column({ name: 'is_show_total', type: 'boolean', nullable: true })
  isShowTotal: boolean;

  @Column({ name: 'total_title', type: 'varchar', length: 50, nullable: true })
  totalTitle: string;

  @Column({ name: 'validate_total_min', type: 'integer', nullable: true })
  validateTotalMin: number;

  @Column({ name: 'validate_total_max', type: 'integer', nullable: true })
  validateTotalMax: number;

  @Column({ name: 'formula', type: 'varchar', length: 50, nullable: true })
  formula: string;

  @ManyToOne(() => DformVersionEntity)
  @JoinColumn({ name: 'form_version_id' })
  formVersion: DformVersionEntity;
}
