import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  QuotaException,
  DataAccessException,
} from '../../../common/exceptions/quota.exception';
import {
  SaveStoreOpeningReportRequest,
  SaveReportResponse,
} from '../../../domain/quotaReport';
import { QuotaReportRepositoryPort } from '../../ports/quotaReport.repository';

@Injectable()
export class SaveStoreOpeningReportUseCase {
  private readonly logger = new Logger(SaveStoreOpeningReportUseCase.name);

  constructor(
    @Inject('QuotaReportRepository')
    private readonly quotaReportRepository: QuotaReportRepositoryPort,
  ) {}

  async execute(
    request: SaveStoreOpeningReportRequest,
    userId: number,
  ): Promise<SaveReportResponse> {
    try {
      await this.quotaReportRepository.saveStoreOpeningReport(request, userId);

      this.logger.log('Store opening report saved successfully');

      return {
        success: true,
        message: 'Store opening report saved successfully',
      };
    } catch (error) {
      this.logger.error('Failed to save store opening report', error);

      if (error instanceof QuotaException) {
        return {
          success: false,
          message: 'Failed to save store opening report',
          error: {
            code: error.code,
            message: error.message,
          },
        };
      }

      throw new DataAccessException(
        error.message || 'Failed to save store opening report',
      );
    }
  }
}
