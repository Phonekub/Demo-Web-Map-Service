import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { DformValueEntity } from './dformValue.entity';

@Entity('dform_text', { schema: 'allmap' })
export class DformTextEntity {
  @PrimaryColumn({ name: 'value_id', type: 'integer' })
  valueId: number;

  @Column({ name: 'value_text', type: 'varchar', length: 255, nullable: true })
  valueText: string;

  @ManyToOne(() => DformValueEntity)
  @JoinColumn({ name: 'value_id' })
  value: DformValueEntity;
}
