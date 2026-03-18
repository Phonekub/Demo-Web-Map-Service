import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseAuditEntity } from './baseAudit.entity';

@Entity({ schema: 'allmap', name: 'quota_report_site_impact' })
export class QuotaReportSiteImpactEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'year', type: 'varchar', length: 4 })
  year: string;

  @Column({
    name: 'form_no_list',
    type: 'varchar',
    length: 4000,
    nullable: true,
  })
  formNoList: string;

  @Column({
    name: 'location_type_list',
    type: 'varchar',
    length: 4000,
    nullable: true,
  })
  locationTypeList: string;

  @Column({
    name: 'site_type_list',
    type: 'varchar',
    length: 4000,
    nullable: true,
  })
  siteTypeList: string;

  @Column({
    name: 'zone_list',
    type: 'varchar',
    length: 4000,
    nullable: true,
  })
  zoneList: string;

  @Column({
    name: 'radius',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  radius: number;

  @Column({
    name: 'file_path',
    type: 'varchar',
    length: 2000,
    nullable: true,
  })
  filePath: string;

  @Column({
    name: 'is_active',
    type: 'char',
    length: 1,
    default: 'N',
  })
  isActive: string;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 1000,
    nullable: true,
  })
  status: string;
}
