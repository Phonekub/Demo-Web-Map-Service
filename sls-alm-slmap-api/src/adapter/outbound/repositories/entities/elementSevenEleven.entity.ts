import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PoiPotentialEntity } from './potential.entity';

@Entity({
  name: 'element_seven_eleven',
  schema: 'allmap',
})
export class ElementSevenElevenEntity {
  @PrimaryGeneratedColumn({
    name: 'id',
    type: 'bigint',
  })
  id: number;

  @Column({
    name: 'potential_store_id',
    type: 'integer',
    nullable: false,
  })
  potentialStoreId: number;

  @Column({
    name: 'element_number',
    type: 'varchar',
    nullable: true,
  })
  elementNumber: string;

  @Column({
    name: 'storecode',
    type: 'varchar',
    nullable: true,
  })
  storeCode: string;

  @Column({
    name: 'name',
    type: 'varchar',
    nullable: true,
  })
  name: string;

  @Column({
    name: 'impact_type_site',
    type: 'bigint',
    nullable: true,
  })
  impactTypeSite: number;

  @Column({
    name: 'impact_detail',
    type: 'varchar',
    nullable: true,
  })
  impactDetail: string;

  @Column({
    name: 'estimate_date_open',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  estimateDateOpen: string;

  @Column({
    name: 'store_width',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  storeWidth: number;

  @Column({
    name: 'store_length',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  storeLength: number;

  @Column({
    name: 'sale_area',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  saleArea: number;

  @Column({
    name: 'stock_area',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  stockArea: number;

  @Column({
    name: 'store_area',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  storeArea: number;

  @Column({
    name: 'parking_count',
    type: 'smallint',
    nullable: true,
  })
  parkingCount: number;

  @Column({
    name: 'store_building_type',
    type: 'smallint',
    nullable: true,
  })
  storeBuildingType: number;

  @Column({
    name: 'store_franchise',
    type: 'smallint',
    nullable: true,
  })
  storeFranchise: number;

  @Column({
    name: 'is_active',
    type: 'varchar',
    length: 1,
    default: 'Y',
    nullable: true,
  })
  isActive: string;

  @Column({
    name: 'standard_layout',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  standardLayout: string;

  @Column({
    name: 'flow_status',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  flowStatus: string;

  @CreateDateColumn({
    name: 'created_date',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdDate: Date;

  @Column({
    name: 'created_by',
    type: 'integer',
    nullable: true,
  })
  createdBy: number;

  @UpdateDateColumn({
    name: 'updated_date',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedDate: Date;

  @ManyToOne(
    () => PoiPotentialEntity,
    (potentialStore) => potentialStore.sevenElevenElements,
  )
  @JoinColumn({
    name: 'potential_store_id',
  })
  potentialStore: PoiPotentialEntity;
}
