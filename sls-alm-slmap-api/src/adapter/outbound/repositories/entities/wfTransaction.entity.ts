import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { WorkflowEntity } from './workflow.entity';
import { WorkflowStatusEntity } from './workflowStatus.entity';
import { WfStepHistoryEntity } from './wfStepHistory.entity';

@Entity('wf_transaction')
export class WfTransactionEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'wf_id' })
  wfId: number;

  @Column({ name: 'ref_id' })
  refId: number;

  @Column({ name: 'wf_step_id' })
  wfStepId: number;

  @Column({ name: 'wf_status_id' })
  wfStatusId: number;

  @Column({ name: 'approve_by' })
  approveBy: string;

  @Column({ name: 'approve_type' })
  approveType: string;

  @Column({ name: 'last_approve_remark' })
  lastApproveRemark: string;

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

  @ManyToOne(() => WorkflowEntity, { nullable: true })
  @JoinColumn({ name: 'wf_id' })
  workflow: WorkflowEntity;

  // ✅ Relation กับ WorkflowStatus
  @ManyToOne(() => WorkflowStatusEntity, { nullable: true })
  @JoinColumn({ name: 'wf_status_id' })
  workflowStatus: WorkflowStatusEntity;

  @OneToMany(() => WfStepHistoryEntity, (stepHistory) => stepHistory.wfTransaction)
  wfStepHistory: WfStepHistoryEntity[];
}
