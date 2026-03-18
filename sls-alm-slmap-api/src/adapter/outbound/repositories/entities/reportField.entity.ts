import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('afs_report_field')
export class ReportFieldEntity {
  @PrimaryGeneratedColumn({ name: 'AFS_REPORT_FIELD' })
  afsReportField: number;

  @Column({ name: 'AFS_REPORT_ID' })
  afsReportId: number;

  @Column({ name: 'FIELD_SEQ' })
  fieldSeq: number;

  @Column({ name: 'FIELD_NAME' })
  fieldName: string;

  @Column({ name: 'DISPLAY_NAME' })
  displayName: string;

  @Column({ name: 'CSS_CONFIG' })
  cssConfig: string;

  @Column({ name: 'DATA_TYPE' })
  dataType: string;

  @Column({ name: 'SHOW_NULL_VALUE' })
  showNullValue: string;

  @Column({ name: 'DISPLAY_NAME_TH' })
  displayNameTh: string;

  @Column({ name: 'DISPLAY_NAME_EN' })
  displayNameEn: string;

  @Column({ name: 'DISPLAY_NAME_KH' })
  displayNameKh: string;

  @Column({ name: 'DISPLAY_NAME_LA' })
  displayNameLa: string;
}
