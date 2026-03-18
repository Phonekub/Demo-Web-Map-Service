import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

@Entity('wf_step')
export class WorkflowStepEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'wf_id', type: 'int' })
  wfId: number;

  @Column({ name: 'wf_step_name', type: 'varchar', length: 255 })
  wfStepName: string;

  @Column({ name: 'wf_step_name_th', type: 'varchar', length: 255 })
  wfStepNameTh: string;

  @Column({ name: 'wf_step_name_en', type: 'varchar', length: 255 })
  wfStepNameEn: string;

  @Column({ name: 'wf_step_name_kh', type: 'varchar', length: 255 })
  wfStepNameKh: string;

  @Column({ name: 'wf_step_name_la', type: 'varchar', length: 255 })
  wfStepNameLa: string;

  @Column({ name: 'step_owner_type', type: 'varchar', length: 50 })
  stepOwnerType: string;

  @Column({ name: 'step_owner_role', type: 'varchar', length: 100 })
  stepOwnerRole: string;

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
