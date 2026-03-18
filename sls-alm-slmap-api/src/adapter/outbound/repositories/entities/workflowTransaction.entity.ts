import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

@Entity('wf_transaction')
export class WorkFlowTransactionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'wf_id', type: 'int' })
  wfId: number;

  @Column({ name: 'ref_id', type: 'int' })
  refId: number;

  @Column({ name: 'wf_step_id', type: 'int' })
  wfStepId: number;

  @Column({ name: 'wf_status_id', type: 'int' })
  wfStatusId: number;

  @Column({ name: 'approve_by', type: 'varchar', length: 100 })
  approveBy: string;

  @Column({ name: 'approve_type', type: 'varchar', length: 50 })
  approveType: string;

  @Column({ name: 'last_approve_remark', type: 'text', nullable: true })
  lastApproveRemark: string;

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
