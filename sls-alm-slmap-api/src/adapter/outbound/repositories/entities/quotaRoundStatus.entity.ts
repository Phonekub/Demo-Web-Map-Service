import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseAuditEntity } from './baseAudit.entity';

@Entity({ schema: 'allmap', name: 'quota_round_status' })
export class QuotaRoundStatusEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', type: 'varchar' })
  name: string;

  @Column({ name: 'is_active', length: 1, default: 'Y' })
  isActive: string;
}
