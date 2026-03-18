import { Inject, Injectable, Logger } from '@nestjs/common';
import { QuotaAllocationRepositoryPort } from '../../ports/quotaAllocation.repository';
import { GetItemHistoryResponse } from '../../../domain/quotaAllocation';
import { DataAccessException } from '../../../common/exceptions/quota.exception';

@Injectable()
export class GetItemHistoryUseCase {
  private readonly logger = new Logger(GetItemHistoryUseCase.name);

  constructor(
    @Inject('QuotaAllocationRepository')
    private readonly quotaAllocationRepository: QuotaAllocationRepositoryPort,
  ) {}

  async execute(itemId: number): Promise<GetItemHistoryResponse> {
    try {
      this.logger.log(`Getting history for item ${itemId}`);

      const history = await this.quotaAllocationRepository.getItemHistory(itemId);

      this.logger.log(
        `Retrieved ${history.history.length} history records for item ${itemId}`,
      );

      return history;
    } catch (error) {
      this.logger.error(`Failed to get item history for item ${itemId}`, error);

      if (error instanceof DataAccessException) {
        throw error;
      }

      throw new DataAccessException(`Failed to retrieve history for item ${itemId}`);
    }
  }
}
