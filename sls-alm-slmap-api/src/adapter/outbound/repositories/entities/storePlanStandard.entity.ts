import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('store_plan_standard')
export class StorePlanStandardEntity {
  @PrimaryGeneratedColumn()
  file_id: number;

  @Column()
  filename: string;

  @Column()
  version: string;

  @Column({ type: 'timestamp' })
  upload_date: Date;

  @Column()
  upload_by: string;

  @Column()
  filepath: string;

  @Column({ nullable: true, default: 'N' })
  can_load: string;
  
  @Column({ type: 'varchar', length: 1, default: 'N' })
  is_deleted: string;
}
