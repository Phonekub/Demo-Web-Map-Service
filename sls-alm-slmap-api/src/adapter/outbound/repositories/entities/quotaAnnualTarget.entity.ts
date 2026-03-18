import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { QuotaConfigEntity } from './quotaConfig.entity';
import { ZoneEntity } from './zone.entity';
import { BaseAuditEntity } from './baseAudit.entity';

@Entity({ name: 'quota_annual_target', schema: 'allmap' })
export class QuotaAnnualTargetEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'quota_config_id' })
  quotaConfigId: number;

  @Column({ name: 'zone_id' })
  zoneId: number;

  @Column({ default: 0 })
  target: number;

  @ManyToOne(() => QuotaConfigEntity, (quotaConfig) => quotaConfig.annualTargets)
  @JoinColumn({ name: 'quota_config_id' })
  quotaConfig: QuotaConfigEntity;

  @ManyToOne(() => ZoneEntity)
  @JoinColumn({ name: 'zone_id' })
  zone: ZoneEntity;
}
