import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { WfTransactionEntity } from './wfTransaction.entity';

@Entity('wf_step_history')
export class WfStepHistoryEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'wf_transaction_id' })
  wfTransactionId: number;

  @Column({ name: 'ref_id' })
  refId: number;

  @Column({ name: 'wf_step_id' })
  wfStepId: number;

  @Column({ name: 'wf_status_id' })
  wfStatusId: number;

  @Column({ name: 'wf_action_id' })
  wfActionId: number;

  @Column({ name: 'remark' })
  remark: string;

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

  @ManyToOne(() => UserEntity, (user) => user.wfStepHistories)
  @JoinColumn({ name: 'create_by' })
  user: UserEntity;

  @ManyToOne(() => WfTransactionEntity, (transaction) => transaction.wfStepHistory)
  @JoinColumn({ name: 'wf_transaction_id' })
  wfTransaction: WfTransactionEntity;
}
