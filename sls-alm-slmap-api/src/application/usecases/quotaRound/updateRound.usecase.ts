import { Inject, Injectable } from '@nestjs/common';
import { QuotaRoundRepositoryPort } from '../../ports/quotaRound.repository';
import { QuotaRound } from '../../../domain/quotaRound';
import { QuotaException } from '../../../common/exceptions/quota.exception';

@Injectable()
export class UpdateRoundUsecase {
  constructor(
    @Inject('QuotaRoundRepository')
    private readonly quotaRoundRepo: QuotaRoundRepositoryPort,
  ) {}

  async handler(round: QuotaRound, userId?: number) {
    try {
      const roundId = await this.quotaRoundRepo.updateRound(round, userId);

      return {
        round_id: roundId,
        success: true,
        code: 'ROUND_UPDATED',
        message: 'Quota round updated successfully',
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
          message: error.message || 'An error occurred while saving quota data',
        },
      };
    }
  }
}
