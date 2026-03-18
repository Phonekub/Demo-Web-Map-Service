import { Inject, Injectable } from '@nestjs/common';
import { TradeareaRepositoryPort } from '../../ports/tradearea.repository';
import { Language } from '../../../common/enums/language.enum';
import { ReportFieldEntity } from '../../../adapter/outbound/repositories/entities/reportField.entity';
import { MasterRepositoryPort } from '../../ports/master.repository';

@Injectable()
export class ExportReportUseCase {
  constructor(
    @Inject('MasterRepository')
    private readonly masterRepository: MasterRepositoryPort,

    @Inject('ExcelDynamicExportGatewayPort')
    private readonly excelExportGateway: any,
  ) {}

  async handler(exportId: number, language?: Language) {
    const fields = await this.masterRepository.getReportFields(exportId);
    if (!fields || fields.length === 0) {
      throw new Error('Report configuration fields not found');
    }

    const config = await this.masterRepository.getReportConfig(exportId);
    if (!config || !config.reportQuery) {
      throw new Error('Report query configuration not found');
    }

    const rawData = await this.masterRepository.executeDynamicQuery(
      config.reportQuery,
      'allmap',
    );

    const reportData = rawData.map((row) => {
      const mappedRow: Record<string, any> = {};

      fields.forEach((field) => {
        const headerName = this.getDisplayNameByLanguage(field, language);
        mappedRow[headerName] =
          row[field.fieldName] ?? row[field.fieldName.toLowerCase()] ?? '';
      });

      return mappedRow;
    });

    const report = {
      headers: fields.map((f) => this.getDisplayNameByLanguage(f, language)),
      data: reportData,
      fileName: config.reportFileName || 'report', // ดึงมาจาก afs_report_config
    };

    const excelStream = await this.excelExportGateway.generateDynamicReport(
      report.headers,
      report.data,
      report.fileName,
    );

    return {
      excelStream,
      fileName: report.fileName,
    };
  }

  private getDisplayNameByLanguage(
    field: ReportFieldEntity,
    language?: Language,
  ): string {
    switch (language) {
      case Language.EN:
        return field.displayNameEn || field.displayName;
      case Language.KM:
        return field.displayNameKh || field.displayName;
      case Language.TH:
        return field.displayNameTh || field.displayName;
      default:
        return field.displayName;
    }
  }
}
