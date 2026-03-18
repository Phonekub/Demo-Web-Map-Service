import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('dform_config', { schema: 'allmap' })
export class DformConfigEntity {
  @PrimaryColumn({ name: 'form_config_id', type: 'integer' })
  formConfigId: number;

  @Column({ name: 'form_title', type: 'varchar', length: 10, nullable: true })
  formTitle: string;

  @Column({ name: 'form_name', type: 'varchar', length: 50, nullable: true })
  formName: string;

  @Column({ name: 'value_table_name', type: 'varchar', length: 50, nullable: true })
  valueTableName: string;
}
