import { Inject, Injectable } from '@nestjs/common';
import { QuotaRoundRepositoryPort } from '../../ports/quotaRound.repository';
import { QuotaException, QuotaNotFoundException } from '../../../common/exceptions/quota.exception';

@Injectable()
export class CloseQuotaConfigUseCase {
  constructor(
    @Inject('QuotaRoundRepository')
    private readonly quotaRoundRepo: QuotaRoundRepositoryPort,
  ) {}

  async handler(year: number, locationType: string, quotaType: string, userId: number) {
    try {
      const config = await this.quotaRoundRepo.getQuotaConfig(year, locationType, quotaType);
      if (!config) {
        throw new QuotaNotFoundException('Quota config not found');
      }

      const rounds = await this.quotaRoundRepo.getRoundsByConfigId(config.id);

      const activeRounds = rounds.filter(r => r.quotaRoundStatusId !== 4);

      if (activeRounds.length === 0) {
        throw new QuotaException('NO_ROUNDS', 'No rounds found for this quota config');
      }

      const allCompleted = activeRounds.every(r => r.quotaRoundStatusId === 3);
      if (!allCompleted) {
        throw new QuotaException(
          'ROUNDS_NOT_COMPLETED',
          'All rounds must be completed before closing the quota year',
        );
      }

      await this.quotaRoundRepo.closeQuotaConfig(year, locationType, quotaType, userId);
      return {
        success: true,
        code: 'YEAR_SCOPE_CLOSED',
        message: 'Quota year scope closed successfully',
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
          message: error.message || 'An error occurred while closing Quota config',
        },
      };
    }
  }
}
