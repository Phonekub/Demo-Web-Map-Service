import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('wf_parameter')
export class WfParameterEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'code' })
  code: string;

  @Column({ name: 'description', nullable: true })
  description: string;

  @Column({ name: 'is_active' })
  isActive: string;

  @Column({ name: 'create_by' })
  createBy: number;

  @Column({ name: 'create_date', type: 'timestamp' })
  createDate: Date;

  @Column({ name: 'update_by' })
  updateBy: number;

  @Column({ name: 'update_date', type: 'timestamp' })
  updateDate: Date;

  @Column({ name: 'version_no' })
  versionNo: string;
}
