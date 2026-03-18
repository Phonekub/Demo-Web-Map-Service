import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  QuotaException,
  DataAccessException,
} from '../../../common/exceptions/quota.exception';
import {
  SaveImpactSiteReportRequest,
  SaveReportResponse,
} from '../../../domain/quotaReport';
import { QuotaReportRepositoryPort } from '../../ports/quotaReport.repository';

@Injectable()
export class SaveImpactSiteReportUseCase {
  private readonly logger = new Logger(SaveImpactSiteReportUseCase.name);

  constructor(
    @Inject('QuotaReportRepository')
    private readonly quotaReportRepository: QuotaReportRepositoryPort,
  ) {}

  async execute(
    request: SaveImpactSiteReportRequest,
    userId: number,
  ): Promise<SaveReportResponse> {
    try {
      await this.quotaReportRepository.saveImpactSiteReport(request, userId);

      this.logger.log('Impact site report saved successfully');

      return {
        success: true,
        message: 'Impact site report saved successfully',
      };
    } catch (error) {
      this.logger.error('Failed to save Impact site report', error);

      if (error instanceof QuotaException) {
        return {
          success: false,
          message: 'Failed to save Impact site report',
          error: {
            code: error.code,
            message: error.message,
          },
        };
      }

      throw new DataAccessException(error.message || 'Failed to save Impact site report');
    }
  }
}
