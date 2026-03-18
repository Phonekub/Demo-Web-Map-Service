import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

@Entity('wf')
export class WorkflowEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'wf_name', type: 'varchar', length: 255 })
  wfName: string;

  @Column({ name: 'wf_name_th', type: 'varchar', length: 255 })
  wfNameTh: string;

  @Column({ name: 'wf_name_en', type: 'varchar', length: 255 })
  wfNameEn: string;

  @Column({ name: 'wf_name_kh', type: 'varchar', length: 255 })
  wfNameKh: string;

  @Column({ name: 'wf_name_la', type: 'varchar', length: 255 })
  wfNameLa: string;

  @Column({ name: 'first_step_id', type: 'int' })
  firstStepId: number;

  @Column({ name: 'first_status_id', type: 'int' })
  firstStatusId: number;

  @Column({ name: 'first_action_id', type: 'int' })
  firstActionId: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'create_by', type: 'varchar', length: 100 })
  createBy: string;

  @CreateDateColumn({ name: 'create_date' })
  createDate: Date;

  @Column({ name: 'update_by', type: 'varchar', length: 100, nullable: true })
  updateBy: string;

  @UpdateDateColumn({ name: 'update_date' })
  updateDate: Date;

  @VersionColumn({ name: 'version_no' })
  versionNo: number;
}
