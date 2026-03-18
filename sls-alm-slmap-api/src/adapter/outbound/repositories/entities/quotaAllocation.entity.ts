import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { QuotaRoundEntity } from './quotaRound.entity';
import { ZoneEntity } from './zone.entity';
import { BaseAuditEntity } from './baseAudit.entity';
import { QuotaAllocationItemEntity } from './quotaAllocationItem.entity';

@Entity({ schema: 'allmap', name: 'quota_allocation' })
export class QuotaAllocationEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'quota_round_id' })
  quotaRoundId: number;

  @Column({ name: 'zone_id' })
  zoneId: number;

  @Column({ name: 'assigned_quota', default: 0 })
  assignedQuota: number;

  @Column({ name: 'reserved_quota', default: 0 })
  reservedQuota: number;

  @ManyToOne(() => QuotaRoundEntity, (round) => round.allocations)
  @JoinColumn({ name: 'quota_round_id' })
  quotaRound: QuotaRoundEntity;

  @ManyToOne(() => ZoneEntity)
  @JoinColumn({ name: 'zone_id' })
  zone: ZoneEntity;

  @OneToMany(() => QuotaAllocationItemEntity, (item) => item.quotaAllocation, {
    cascade: true,
  })
  quotaAllocationItems: QuotaAllocationItemEntity[];
}
