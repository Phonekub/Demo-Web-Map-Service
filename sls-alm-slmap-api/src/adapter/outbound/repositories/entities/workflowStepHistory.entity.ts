import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

@Entity('wf_step_history')
export class WorkflowStepHistoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'wf_transaction_id', type: 'int' })
  wfTransactionId: number;

  @Column({ name: 'ref_id', type: 'int' })
  refId: number;

  @Column({ name: 'wf_step_id', type: 'int' })
  wfStepId: number;

  @Column({ name: 'wf_status_id', type: 'int' })
  wfStatusId: number;

  @Column({ name: 'wf_action_id', type: 'int' })
  wfActionId: number;

  @Column({ name: 'remark', type: 'text', nullable: true })
  remark: string;

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
