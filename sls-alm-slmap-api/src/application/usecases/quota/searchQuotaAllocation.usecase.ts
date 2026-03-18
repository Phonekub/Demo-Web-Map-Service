import { Inject, Injectable } from '@nestjs/common';
import { QuotaAllocationSearchRepositoryPort } from '../../ports/quotaAllocationSearch.repository';
import { QuotaSearchQuery, QuotaSearchResponse } from '../../../domain/quotaSearch';
import { QuotaException } from '../../../common/exceptions/quota.exception';

@Injectable()
export class SearchQuotaAllocationUseCase {
  constructor(
    @Inject('QuotaAllocationSearchRepository')
    private readonly quotaAllocationSearchRepository: QuotaAllocationSearchRepositoryPort,
  ) {}

  async search(
    query: QuotaSearchQuery,
    userZones: string[],
    userId?: number,
    roleId?: number,
  ): Promise<QuotaSearchResponse> {
    try {
      const [quotas] = await this.quotaAllocationSearchRepository.searchQuotas(
        query,
        userZones,
        userId,
        roleId,
      );

      return {
        data: quotas,
      };
    } catch (error) {
      if (error instanceof QuotaException) {
        throw error;
      }
      throw new QuotaException(
        'DATA_ACCESS_ERROR',
        'An error occurred while accessing quota allocation data.',
      );
    }
  }
}
