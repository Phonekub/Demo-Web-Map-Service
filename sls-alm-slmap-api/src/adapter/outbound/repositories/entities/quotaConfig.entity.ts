import {
  Column,
  Entity,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { QuotaAnnualTargetEntity } from './quotaAnnualTarget.entity';
import { BaseAuditEntity } from './baseAudit.entity';

@Entity('quota_config')
export class QuotaConfigEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'year' })
  year: string;

  @Column({ name: 'location_type' })
  locationType: string;

  @Column({ name: 'quota_type' })
  quotaType: string;

  @Column({ name: 'is_closed' })
  isClosed: string;

  @Column({ name: 'is_visible' })
  isVisible: string;

  @OneToMany(() => QuotaAnnualTargetEntity, (target) => target.quotaConfig)
  annualTargets: QuotaAnnualTargetEntity[];
}
