import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { WfTransactionEntity } from './wfTransaction.entity';
import { PoiEntity } from './poi.entity';
import { TradeareaTypeEntity } from './tradeareaType.entity';

@Entity('trade_area', { schema: 'allmap' })
export class TradeareaEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'zone_code', nullable: true })
  zoneCode: string;

  @Column({ name: 'subzone_code', nullable: true })
  subzoneCode: string;

  @Column({ name: 'store_name', nullable: true })
  storeName: string;

  @Column({ name: 'ref_storecode' })
  refStoreCode: string;

  @Column({
    name: 'effective_date',
    type: 'date',
    nullable: true,
  })
  effectiveDate?: string;

  @Column({
    name: 'shape',
    type: 'geometry',
    srid: 4326,
  })
  shape: object | string;

  @Column({ name: 'area_color', nullable: true })
  areaColor?: string;

  @Column({ name: 'comment', nullable: true })
  comment?: string;

  @Column({ name: 'warning', nullable: true })
  warning?: string;

  @Column({ name: 'global_id', type: 'uuid' })
  globalId: string;

  @Column({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Column({ name: 'create_user', nullable: true })
  createUser?: string;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt?: Date;

  @Column({ name: 'update_user', nullable: true })
  updateUser?: string;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @Column({ name: 'delete_user', nullable: true })
  deleteUser?: string;

  @Column({ name: 'delete_by', nullable: true })
  deleteBy?: number;

  @Column({ name: 'ref_point_x', type: 'double precision', nullable: true })
  refPointX?: number;

  @Column({ name: 'ref_point_y', type: 'double precision', nullable: true })
  refPointY?: number;

  @Column({ name: 'status', type: 'varchar', length: 50, nullable: true })
  status?: string;

  @Column({ name: 'wf_transaction_id', type: 'int', nullable: true })
  wfTransactionId?: number;

  @Column({ name: 'poi_id', type: 'int8', nullable: true })
  poiId?: number;

  @Column({ name: 'trade_area_type_id' })
  tradeareaTypeId: number;

  @Column({ name: 'parent_id', type: 'int8', nullable: true })
  parentId?: number;

  @ManyToOne(() => WfTransactionEntity, { nullable: true })
  @JoinColumn({ name: 'wf_transaction_id' })
  workflowTransaction: WfTransactionEntity;

  @ManyToOne(() => TradeareaTypeEntity, { nullable: true })
  @JoinColumn({ name: 'trade_area_type_id' })
  tradeareaType: TradeareaTypeEntity;

  @ManyToOne(() => PoiEntity, (poi) => poi.tradearea)
  @JoinColumn({ name: 'poi_id' })
  poi: PoiEntity;
}
