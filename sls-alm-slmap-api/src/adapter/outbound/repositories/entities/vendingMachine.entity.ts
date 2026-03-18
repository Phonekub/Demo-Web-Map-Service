import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PoiEntity } from './poi.entity';

@Entity({
  name: 'poi_vending_machine',
})
export class PoiVendingMachineEntity {
  @PrimaryGeneratedColumn({
    name: 'id',
    type: 'bigint',
  })
  id: number;

  @Column({
    name: 'uid',
    type: 'uuid',
    nullable: false,
  })
  uid: string;

  @Column({
    name: 'poi_id',
    type: 'integer',
    nullable: false,
  })
  poiId: number;

  @Column({
    name: 'main_storecode',
    type: 'varchar',
    nullable: true,
  })
  mainStorecode: string;

  @Column({
    name: 'main_storename',
    type: 'varchar',
    nullable: true,
  })
  mainStorename: string;

  @Column({
    name: 'machine_id',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  machineId: string;

  @Column({
    name: 'location_type_code',
    type: 'integer',
    nullable: true,
  })
  locationTypeCode: number;

  @Column({
    name: 'form_loc_number',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  formLocNumber: string;

  @Column({
    name: 'serial_number',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  serialNumber: string;

  @Column({
    name: 'type',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  type: string;

  @Column({
    name: 'model',
    type: 'varchar',
    length: 2,
    nullable: true,
  })
  model: string;

  @Column({
    name: 'flow_status',
    type: 'varchar',
    nullable: true,
  })
  flowStatus: string;

  @Column({
    name: 'is_active',
    type: 'varchar',
    length: 1,
    nullable: true,
    default: 'Y',
  })
  isActive: string;

  @Column({
    name: 'created_date',
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdDate: Date;

  @Column({
    name: 'created_by',
    type: 'integer',
    nullable: true,
  })
  createdBy: number;

  @Column({
    name: 'updated_date',
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedDate: Date;

  @ManyToOne(() => PoiEntity)
  @JoinColumn({
    name: 'poi_id',
  })
  poi: PoiEntity;
}
