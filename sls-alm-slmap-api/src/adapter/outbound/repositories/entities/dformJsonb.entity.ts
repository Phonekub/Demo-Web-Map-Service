import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { DformValueEntity } from './dformValue.entity';
import { DformFieldEntity } from './dformField.entity';

@Entity('dform_jsonb', { schema: 'allmap' })
export class DformJsonbEntity {
  @PrimaryColumn({ name: 'value_id', type: 'integer' })
  valueId: number;

  @PrimaryColumn({ name: 'field_id', type: 'integer' })
  fieldId: number;

  @Column({ name: 'value_jsonb', type: 'jsonb', nullable: true })
  valueJsonb: any;

  @ManyToOne(() => DformValueEntity)
  @JoinColumn({ name: 'value_id' })
  value: DformValueEntity;

  @ManyToOne(() => DformFieldEntity)
  @JoinColumn({ name: 'field_id' })
  field: DformFieldEntity;
}
