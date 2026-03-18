import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { DformEntity } from './dform.entity';
import { DformFieldEntity } from './dformField.entity';

@Entity('dform_value', { schema: 'allmap' })
export class DformValueEntity {
  @PrimaryColumn({ name: 'value_id', type: 'integer' })
  valueId: number;

  @Column({ name: 'form_id', type: 'integer', nullable: true })
  formId: number;

  @Column({ name: 'field_id', type: 'integer', nullable: true })
  fieldId: number;

  @Column({ name: 'value', type: 'varchar', length: 255, nullable: true })
  value: string;

  @ManyToOne(() => DformEntity)
  @JoinColumn({ name: 'form_id' })
  form: DformEntity;

  @ManyToOne(() => DformFieldEntity)
  @JoinColumn({ name: 'field_id' })
  field: DformFieldEntity;
}
