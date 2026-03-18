import { Stream } from 'stream';

export interface ExcelExportGatewayPort {
  generateDynamicReport(
    headers: string[],
    data: any[],
    sheetName?: string,
  ): Promise<Stream>;
}
