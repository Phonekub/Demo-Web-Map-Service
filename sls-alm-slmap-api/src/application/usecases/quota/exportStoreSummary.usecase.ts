import { Inject, Injectable } from '@nestjs/common';
import { Stream } from 'stream';
import { MasterRepositoryPort } from '../../ports/master.repository';
import { Language } from '../../../common/enums/language.enum';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { QuotaReportRepositoryPort } from '../../ports/quotaReport.repository';
import { ExcelSummaryExportGatewayPort } from '../../ports/generateSummaryExcel.repository';

@Injectable()
export class ExportStoreSummaryUseCase {
  constructor(
    @Inject('QuotaReportRepository')
    private readonly quotaReportRepository: QuotaReportRepositoryPort,

    @Inject('ExcelSummaryExportGatewayPort')
    private readonly excelGateway: ExcelSummaryExportGatewayPort,

    @Inject('MasterRepository')
    private readonly masterRepository: MasterRepositoryPort,

    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    year: string,
    locationType: string,
    quotaType: string,
    language: Language,
  ): Promise<Stream> {
    const [summary, zones] = await Promise.all([
      this.quotaReportRepository.getSummaryReport(year, locationType, quotaType),
      this.masterRepository.getZones('2', 'MAIN'),
    ]);

    const zoneRegionMap = new Map<string, string>();
    zones.forEach((z) => {
      zoneRegionMap.set(z.zoneCode, z.region);
    });

    const zoneOrderMap = new Map<string, number>();
    zones.forEach((z, i) => zoneOrderMap.set(z.zoneCode, i));

    summary.sort((a, b) => {
      return (
        (zoneOrderMap.get(a.zoneCode) ?? 999) - (zoneOrderMap.get(b.zoneCode) ?? 999)
      );
    });

    return this.excelGateway.generateSummaryReport(summary, zoneRegionMap, language);
  }
}
