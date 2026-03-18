import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { QuotaAllocationItemEntity } from './quotaAllocationItem.entity';
import { PoiEntity } from './poi.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'quota_allocation_item_log', schema: 'allmap' })
export class QuotaAllocationItemLogEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'quota_allocation_item_id' })
  quotaAllocationItemId: number;

  @Column({ name: 'detail', type: 'varchar', length: 4000 })
  detail: string;

  @Column({ name: 'old_poi_id', nullable: true })
  oldPoiId: number;

  @Column({ name: 'new_poi_id', nullable: true })
  newPoiId: number;

  @Column({ name: 'remark', type: 'varchar', length: 1000, nullable: true })
  remark: string;

  @Column({ name: 'create_by', nullable: true })
  createBy: number;

  @Column({ name: 'create_date', type: 'timestamp', nullable: true })
  createDate: Date;

  @Column({ name: 'update_by', nullable: true })
  updateBy: number;

  @Column({ name: 'update_date', type: 'timestamp', nullable: true })
  updateDate: Date;

  // Relations
  @ManyToOne(() => QuotaAllocationItemEntity)
  @JoinColumn({ name: 'quota_allocation_item_id' })
  quotaAllocationItem: QuotaAllocationItemEntity;

  @ManyToOne(() => PoiEntity, { nullable: true })
  @JoinColumn({ name: 'old_poi_id', referencedColumnName: 'poiId' })
  oldPoi: PoiEntity;

  @ManyToOne(() => PoiEntity, { nullable: true })
  @JoinColumn({ name: 'new_poi_id', referencedColumnName: 'poiId' })
  newPoi: PoiEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'create_by', referencedColumnName: 'id' })
  createdByUser: UserEntity;
}
