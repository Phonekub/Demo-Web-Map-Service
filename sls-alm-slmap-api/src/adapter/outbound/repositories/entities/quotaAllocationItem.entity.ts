import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseAuditEntity } from './baseAudit.entity';
import { QuotaAllocationEntity } from './quotaAllocation.entity';
import { PoiEntity } from './poi.entity';

@Entity({ schema: 'allmap', name: 'quota_allocation_item' })
export class QuotaAllocationItemEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'quota_allocation_id' })
  quotaAllocationId: number;

  @Column({ name: 'seq' })
  seq: number;

  @Column({ name: 'type', type: 'varchar' })
  type: 'MAIN' | 'RESERVE';

  @Column({ name: 'poi_id' })
  poiId: number;

  @Column({ name: 'open_type', type: 'varchar', nullable: true })
  openType: string;

  @Column({ name: 'open_month', type: 'varchar', nullable: true })
  openMonth: string;

  @Column({ name: 'closed_store_poi_id', nullable: true })
  closedStorePoiId: number;

  // Relations
  @ManyToOne(() => QuotaAllocationEntity, (allocation) => allocation.quotaAllocationItems)
  @JoinColumn({ name: 'quota_allocation_id' })
  quotaAllocation: QuotaAllocationEntity;

  @ManyToOne(() => PoiEntity)
  @JoinColumn({ name: 'poi_id', referencedColumnName: 'poiId' })
  poi: PoiEntity;

  @ManyToOne(() => PoiEntity, { nullable: true })
  @JoinColumn({ name: 'closed_store_poi_id', referencedColumnName: 'poiId' })
  closedStorePoi: PoiEntity;
}
