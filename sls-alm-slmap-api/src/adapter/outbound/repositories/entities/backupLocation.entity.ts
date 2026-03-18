import { Column, Entity, PrimaryGeneratedColumn, Generated } from 'typeorm';

@Entity('backup_location')
export class BackupLocationEntity {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Generated('uuid')
  @Column({ name: 'uid', type: 'uuid' })
  uid: string;

  @Column({ name: 'poi_layer_id', type: 'integer', nullable: true })
  poiLayerId: number;

  @Column({ name: 'poi_id', type: 'integer', nullable: true })
  poiId: number;

  @Column({ name: 'form_loc_number', type: 'varchar', length: 50, nullable: true })
  formLocNumber: string;

  @Column({ name: 'zone_code', type: 'varchar', length: 5, nullable: true })
  zoneCode: string;

  @Column({ name: 'shape', type: 'geometry', nullable: true })
  shape: string;

  @Column({ name: 'backup_color', type: 'integer', nullable: true })
  backupColor: number;

  @Column({ name: 'backup_color_layer', type: 'varchar', length: 50, nullable: true })
  backupColorLayer: string;

  @Column({ name: 'is_active', type: 'varchar', length: 1, nullable: true })
  isActive: string;

  @Column({ name: 'main_profile', type: 'varchar', length: 5, nullable: true })
  mainProfile: string;

  @Column({ name: 'sub_profile', type: 'varchar', length: 5, nullable: true })
  subProfile: string;

  @Column({ name: 'area_size', type: 'numeric', precision: 38, scale: 8, nullable: true })
  areaSize: number;

  @Column({ name: 'backup_remark', type: 'varchar', length: 1000, nullable: true })
  backupRemark: string;

  @Column({ name: 'strategic_location', type: 'varchar', length: 5 })
  strategicLocation: string;

  @Column({ name: 'strategic_support', type: 'varchar', length: 5, nullable: true })
  strategicSupport: string;

  @Column({ name: 'strategic_place', type: 'varchar', length: 5, nullable: true })
  strategicPlace: string;

  @Column({ name: 'strategic_place_other', type: 'varchar', length: 100, nullable: true })
  strategicPlaceOther: string;

  @Column({ name: 'strategic_place_name', type: 'varchar', length: 100, nullable: true })
  strategicPlaceName: string;

  @Column({ name: 'strategic_place_guid', type: 'uuid', nullable: true })
  strategicPlaceGuid: string;

  @Column({ name: 'strategic_position', type: 'varchar', length: 5, nullable: true })
  strategicPosition: string;

  @Column({
    name: 'strategic_position_other',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  strategicPositionOther: string;

  @Column({
    name: 'strategic_position_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  strategicPositionName: string;

  @Column({ name: 'strategic_floor', type: 'varchar', length: 50, nullable: true })
  strategicFloor: string;

  @Column({ name: 'strategic_floor_other', type: 'varchar', length: 50, nullable: true })
  strategicFloorOther: string;

  @Column({ name: 'strategic_customer_type', type: 'varchar', length: 5, nullable: true })
  strategicCustomerType: string;

  @Column({ name: 'strategic_housing_type', type: 'varchar', length: 5, nullable: true })
  strategicHousingType: string;

  @Column({
    name: 'strategic_industrial_estate_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  strategicIndustrialEstateName: string;

  @Column({ name: 'street_food', type: 'varchar', length: 100, nullable: true })
  streetFood: string;

  @Column({ name: 'create_date', type: 'timestamp', default: () => 'now()' })
  createDate: Date;

  @Column({ name: 'create_by', type: 'integer', nullable: true })
  createBy: number;

  @Column({ name: 'update_date', type: 'timestamp', nullable: true })
  updateDate: Date;

  @Column({ name: 'update_by', type: 'integer', nullable: true })
  updateBy: number;
}
