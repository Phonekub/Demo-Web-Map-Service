import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseAuditEntity } from './baseAudit.entity';

@Entity({ schema: 'allmap', name: 'quota_report_open_plan' })
export class QuotaReportOpenPlanEntity extends BaseAuditEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', type: 'varchar', length: 1000 })
  name: string;

  @Column({ name: 'year', type: 'varchar', length: 4 })
  year: string;

  @Column({
    name: 'location_type_list',
    type: 'varchar',
    length: 4000,
    nullable: true,
  })
  locationTypeList: string;

  @Column({
    name: 'quota_type_list',
    type: 'varchar',
    length: 4000,
    nullable: true,
  })
  quotaTypeList: string;

  @Column({
    name: 'zone_list',
    type: 'varchar',
    length: 4000,
    nullable: true,
  })
  zoneList: string;

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
}
