import { Stream } from 'stream';
import { Language } from '../../common/enums/language.enum';
import { QuotaSummaryReportResponse } from '../../domain/quotaSummaryReport';

export interface ExcelSummaryExportGatewayPort {
  generateSummaryReport(
    data: QuotaSummaryReportResponse[],
    zoneRegionMap?: Map<string, string>,
    language?: Language,
  ): Promise<Stream>;
}
