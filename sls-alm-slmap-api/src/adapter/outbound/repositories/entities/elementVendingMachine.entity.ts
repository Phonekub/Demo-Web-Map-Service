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
  name: 'element_vending_machine',
  schema: 'allmap',
})
export class ElementVendingMachineEntity {
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
  storecode: string;

  @Column({
    name: 'machine_id',
    type: 'varchar',
    nullable: true,
  })
  machineId: string;

  @Column({
    name: 'floor',
    type: 'smallint',
    nullable: true,
  })
  floor: number;

  @Column({
    name: 'name',
    type: 'varchar',
    nullable: true,
  })
  name: string;

  @Column({
    name: 'vending_model',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  vendingModel: string;

  @Column({
    name: 'serial_number',
    type: 'varchar',
    nullable: true,
  })
  serialNumber: string;

  @Column({
    name: 'vending_type',
    type: 'integer',
    nullable: true,
    comment: 'ประเภทการติดตั้ง',
  })
  vendingType: number;

  @Column({
    name: 'business_type_code',
    type: 'varchar',
    nullable: true,
  })
  businessTypeCode: string;

  @Column({
    name: 'location_address',
    type: 'varchar',
    nullable: true,
  })
  locationAddress: string;

  @Column({
    name: 'contract_start_date',
    type: 'date',
    nullable: true,
  })
  contractStartDate: Date;

  @Column({
    name: 'contract_finish_date',
    type: 'date',
    nullable: true,
  })
  contractFinishDate: Date;

  @Column({
    name: 'contract_cancel_date',
    type: 'date',
    nullable: true,
  })
  contractCancelDate: Date;

  @Column({
    name: 'open_date',
    type: 'date',
    nullable: true,
  })
  openDate: Date;

  @Column({
    name: 'close_date',
    type: 'date',
    nullable: true,
  })
  closeDate: Date;

  @Column({
    name: 'is_active',
    type: 'varchar',
    length: 1,
    nullable: true,
  })
  isActive: string;

  @Column({
    name: 'target_point',
    type: 'varchar',
    nullable: true,
    comment: 'ตำแหน่งจุดจำหน่าย',
  })
  targetPoint: string;

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
    (potentialStore) => potentialStore.vendingMachineElements,
  )
  @JoinColumn({
    name: 'potential_store_id',
  })
  potentialStore: PoiPotentialEntity;
  motherStoreName?: string;
}
