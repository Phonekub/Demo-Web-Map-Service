import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseAuditEntity } from './baseAudit.entity';
import { QuotaAllocationEntity } from './quotaAllocation.entity';
import { QuotaConfigEntity } from './quotaConfig.entity';
import { QuotaRoundStatusEntity } from './quotaRoundStatus.entity';

@Entity({ schema: 'allmap', name: 'quota_round' })
export class QuotaRoundEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'quota_config_id' })
  quotaConfigId: number;

  @Column({ name: 'quota_round_status_id', default: 1 })
  quotaRoundStatusId: number;

  @Column({ name: 'name', type: 'varchar' })
  name: string;

  @Column({ name: 'seq' })
  seq: number;

  @Column({ name: 'start_month', type: 'varchar' })
  startMonth: string;

  @Column({ name: 'end_month', type: 'varchar' })
  endMonth: string;

  @Column({ name: 'due_date', type: 'timestamptz' })
  dueDate: Date;

  @Column({ name: 'is_review', length: 1, default: 'N' })
  isReview: string;

  // Relations
  @OneToMany(() => QuotaAllocationEntity, (allocation) => allocation.quotaRound, {
    cascade: true,
  })
  allocations: QuotaAllocationEntity[];

  @ManyToOne(() => QuotaConfigEntity)
  @JoinColumn({ name: 'quota_config_id' })
  quotaConfig: QuotaConfigEntity;

  @ManyToOne(() => QuotaRoundStatusEntity)
  @JoinColumn({ name: 'quota_round_status_id' })
  quotaRoundStatus: QuotaRoundStatusEntity;
}
