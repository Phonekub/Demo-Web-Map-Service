import { Stream } from 'stream';
import { QuotaAnnualTarget } from '../../domain/quotaAnnualTarget';
import { Language } from '../../common/enums/language.enum';

export interface ExcelExportGatewayPort {
  generateQuotaReport(data: QuotaAnnualTarget[], language?: Language): Promise<Stream>;
}
