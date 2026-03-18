import { Builder } from 'builder-pattern';
import { ExportConfig } from '../../../../domain/reportConfig';
import { ReportConfigEntity } from '../entities/reportConfig.entity';

export interface RawReportConfig {
  afsreportid: number;
  reportname: string;
}
export class ReportConfigMapper {
  static toDomain(raw: RawReportConfig): ExportConfig {
    return Builder(ExportConfig)
      .afs_export_id(raw.afsreportid)
      .export_name(raw.reportname)
      .build();
  }
}
