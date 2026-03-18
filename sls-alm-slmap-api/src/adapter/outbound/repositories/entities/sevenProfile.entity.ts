import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { PoiSevenElevenEntity } from './sevenEleven.entity';

@Entity({
  name: 'seven_profile',
})
export class SevenProfileEntity {
  @PrimaryColumn('varchar', { length: 10, name: 'storecode' })
  storecode!: string;

  @Column('varchar', { name: 'storename', length: 400, nullable: true })
  storeName?: string | null;

  @Column('varchar', { name: 'license_type', length: 100, nullable: true })
  licenseType?: string | null;

  @Column('varchar', { name: 'shop_type', length: 100, nullable: true })
  shopType?: string | null;

  @Column('varchar', { name: 'area_id', length: 10, nullable: true })
  areaId?: string | null;

  @Column('varchar', { name: 'area_name', length: 400, nullable: true })
  areaName?: string | null;

  @Column('varchar', { name: 'zone_code', length: 10, nullable: true })
  zoneCode?: string | null;

  @Column('varchar', { name: 'subzone_code', length: 10, nullable: true })
  subzoneCode?: string | null;

  @Column('varchar', { name: 'tel', length: 200, nullable: true })
  tel?: string | null;

  @Column('varchar', { name: 'addr_no', length: 200, nullable: true })
  addrNo?: string | null;

  @Column('varchar', { name: 'soi', length: 100, nullable: true })
  soi?: string | null;

  @Column('varchar', { name: 'street', length: 100, nullable: true })
  street?: string | null;

  @Column('varchar', { name: 'district_id', length: 10, nullable: true })
  districtId?: string | null;

  @Column('varchar', { name: 'district_name', length: 200, nullable: true })
  districtName?: string | null;

  @Column('varchar', { name: 'amphur_id', length: 10, nullable: true })
  amphurId?: string | null;

  @Column('varchar', { name: 'amphur_name', length: 200, nullable: true })
  amphurName?: string | null;

  @Column('varchar', { name: 'province_id', length: 10, nullable: true })
  provinceId?: string | null;

  @Column('varchar', { name: 'province_name', length: 200, nullable: true })
  provinceName?: string | null;

  @Column('varchar', { name: 'zip_code', length: 100, nullable: true })
  zipCode?: string | null;

  @Column('timestamp', { name: 'open_date', nullable: true })
  openDate?: Date | null;

  @Column('timestamp', { name: 'close_date', nullable: true })
  closeDate?: Date | null;

  @Column('varchar', { name: 'mgr_name', length: 400, nullable: true })
  mgrName?: string | null;

  @Column('varchar', { name: 'fc_employee_id', length: 100, nullable: true })
  fcEmployeeId?: string | null;

  @Column('varchar', { name: 'fc_name', length: 400, nullable: true })
  fcName?: string | null;

  @Column('varchar', { name: 'fc_tel', length: 100, nullable: true })
  fcTel?: string | null;

  @Column('varchar', { name: 'fc_page', length: 100, nullable: true })
  fcPage?: string | null;

  @Column('varchar', { name: 'fc_email', length: 100, nullable: true })
  fcEmail?: string | null;

  @Column('varchar', { name: 'mn_employee_id', length: 100, nullable: true })
  mnEmployeeId?: string | null;

  @Column('varchar', { name: 'mn_name', length: 400, nullable: true })
  mnName?: string | null;

  @Column('varchar', { name: 'mn_tel', length: 100, nullable: true })
  mnTel?: string | null;

  @Column('varchar', { name: 'mn_page', length: 100, nullable: true })
  mnPage?: string | null;

  @Column('varchar', { name: 'mn_email', length: 100, nullable: true })
  mnEmail?: string | null;

  @Column('varchar', { name: 'dv_employee_id', length: 100, nullable: true })
  dvEmployeeId?: string | null;

  @Column('varchar', { name: 'dv_name', length: 400, nullable: true })
  dvName?: string | null;

  @Column('varchar', { name: 'dv_tel', length: 100, nullable: true })
  dvTel?: string | null;

  @Column('varchar', { name: 'dv_page', length: 100, nullable: true })
  dvPage?: string | null;

  @Column('varchar', { name: 'dv_email', length: 100, nullable: true })
  dvEmail?: string | null;

  @Column('varchar', { name: 'gm_employee_id', length: 100, nullable: true })
  gmEmployeeId?: string | null;

  @Column('varchar', { name: 'gm_name', length: 400, nullable: true })
  gmName?: string | null;

  @Column('varchar', { name: 'gm_tel', length: 100, nullable: true })
  gmTel?: string | null;

  @Column('varchar', { name: 'gm_page', length: 100, nullable: true })
  gmPage?: string | null;

  @Column('varchar', { name: 'gm_email', length: 100, nullable: true })
  gmEmail?: string | null;

  @Column('varchar', { name: 'avp_employee_id', length: 100, nullable: true })
  avpEmployeeId?: string | null;

  @Column('varchar', { name: 'avp_name', length: 400, nullable: true })
  avpName?: string | null;

  @Column('varchar', { name: 'avp_tel', length: 100, nullable: true })
  avpTel?: string | null;

  @Column('varchar', { name: 'avp_page', length: 100, nullable: true })
  avpPage?: string | null;

  @Column('varchar', { name: 'avp_email', length: 100, nullable: true })
  avpEmail?: string | null;

  @Column('varchar', { name: 'status_type', length: 200, nullable: true })
  statusType?: string | null;

  @Column('varchar', { name: 'building_type', length: 200, nullable: true })
  buildingType?: string | null;

  @Column('varchar', { name: 'store_type', length: 200, nullable: true })
  storeType?: string | null;

  @Column('varchar', { name: 'room_amount', length: 200, nullable: true })
  roomAmount?: string | null;

  @Column('varchar', { name: 'shelf', length: 200, nullable: true })
  shelf?: string | null;

  @Column('varchar', { name: 'sale_area', length: 200, nullable: true })
  saleArea?: string | null;

  @Column('timestamp', { name: 'create_date', nullable: true })
  createDate?: Date | null;

  @Column('varchar', { name: 'create_by', length: 200, nullable: true })
  createBy?: string | null;

  @Column('timestamp', { name: 'update_date', nullable: true })
  updateDate?: Date | null;

  @Column('varchar', { name: 'update_by', length: 200, nullable: true })
  updateBy?: string | null;

  @Column('varchar', { name: 'location_type_code', length: 50, nullable: true })
  locationTypeCode?: string | null;

  @Column('timestamp', { name: 'renovate_start_date', nullable: true })
  renovateStartDate?: Date | null;

  @Column('timestamp', { name: 'renovate_end_date', nullable: true })
  renovateEndDate?: Date | null;

  @Column('varchar', { name: 'full_address', length: 1000, nullable: true })
  fullAddress?: string | null;

  @Column('varchar', { name: 'product_group', length: 500, nullable: true })
  productGroup?: string | null;

  @Column('timestamp', { name: 'tempclose_start_date', nullable: true })
  tempcloseStartDate?: Date | null;

  @Column('timestamp', { name: 'tempclose_end_date', nullable: true })
  tempcloseEndDate?: Date | null;

  @Column('varchar', { name: 'document_number', length: 50, nullable: true })
  documentNumber?: string | null;

  @OneToOne(() => PoiSevenElevenEntity, (poiSevenEleven) => poiSevenEleven.sevenProfile)
  @JoinColumn({
    name: 'storecode',
    referencedColumnName: 'storecode',
  })
  poiSevenElevens?: PoiSevenElevenEntity;
}
