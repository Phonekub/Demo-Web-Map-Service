import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ExtractLanguage } from '../decorators/language.decorator';
import { Language } from '../../../common/enums/language.enum';
import { ExportReportUseCase } from '../../../application/usecases/exportReport/exportReport.usecase';
import { JwtAuthGuard } from '../guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('report')
export class ReportController {
  constructor(private readonly exportReportUseCase: ExportReportUseCase) {}
  @Get('tradearea/export')
  async exportReport(
    @Query('export_id') exportId: string,
    @ExtractLanguage() language: Language,
    @Res() res: Response,
  ) {
    try {
      const { excelStream, fileName } = await this.exportReportUseCase.handler(
        Number(exportId),
        language,
      );

      const finalFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;

      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'File-name': `${encodeURIComponent(finalFileName)}`,
        'Access-Control-Expose-Headers': 'File-name',
      });

      excelStream.pipe(res);
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({
          message: 'Failed to export report',
          error: error.message,
        });
      }
    }
  }
}
