import { Inject, Injectable } from '@nestjs/common';
import { QuotaException } from '../../../common/exceptions/quota.exception';
import { QuotaReportRepositoryPort } from '../../ports/quotaReport.repository';

@Injectable()
export class DeleteReportImpactSiteUseCase {
  constructor(
    @Inject('QuotaReportRepository')
    private readonly quotaReportRepo: QuotaReportRepositoryPort,
  ) {}

  async handler(reportId: number, userId: number) {
    try {
      await this.quotaReportRepo.deleteReportImpactSite(reportId, userId);
      return {
        success: true,
        code: 'REPORT_DELETED',
        message: 'Quota report impact site deleted successfully',
      };
    } catch (error) {
      if (error instanceof QuotaException) {
        return {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        };
      }

      return {
        success: false,
        error: {
          code: error.code || 'DATA_ACCESS_ERROR',
          message: error.message || 'An error occurred while deleting report data',
        },
      };
    }
  }
}
