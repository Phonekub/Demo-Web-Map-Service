import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('afs_report_config')
export class ReportConfigEntity {
  @PrimaryGeneratedColumn({ name: 'afs_report_id' })
  afsReportId: number;

  @Column({ name: 'afs_org_id' })
  afsOrgId: number;

  @Column({ name: 'report_seq' })
  reportSeq: number;

  @Column({ name: 'report_name' })
  reportName: string;

  @Column({ name: 'report_query' })
  reportQuery: string;

  @Column({ name: 'report_file_name' })
  reportFileName: string;

  @Column({ name: 'timestamp_format' })
  timestampFormat: string;

  @Column({ name: 'servlet_name' })
  servletName: string;

  @Column({ name: 'db_to_use' })
  dbToUse: string;

  @Column({ name: 'file_extension' })
  fileExtension: string;

  @Column({ name: 'file_type' })
  fileType: string;

  @Column({ name: 'report_name_en' })
  reportNameEn: string;

  @Column({ name: 'report_name_kh' })
  reportNameKh: string;

  @Column({ name: 'is_active' })
  isActive: string;
}
