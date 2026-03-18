import { Inject, Injectable } from '@nestjs/common';
import { QuotaRoundRepositoryPort } from '../../ports/quotaRound.repository';
import { QuotaException } from '../../../common/exceptions/quota.exception';

@Injectable()
export class DeleteRoundUseCase {
  constructor(
    @Inject('QuotaRoundRepository')
    private readonly quotaRoundRepo: QuotaRoundRepositoryPort,
  ) {}

  async handler(roundId: number, userId: number) {
    try {
      await this.quotaRoundRepo.deleteRound(roundId, userId);
      return {
        success: true,
        code: 'ROUND_DELETED',
        message: 'Quota round deleted successfully',
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
          message: error.message || 'An error occurred while deleting quota data',
        },
      };
    }
  }
}
