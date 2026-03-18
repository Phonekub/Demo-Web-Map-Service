import { Inject, Injectable, Logger } from '@nestjs/common';
import { QuotaAllocationRepositoryPort } from '../../ports/quotaAllocation.repository';
import { MasterRepositoryPort } from '../../ports/master.repository';
import { QuotaAllocationDetailResponse } from '../../../domain/quotaAllocation';
import { Language } from '../../../common/enums/language.enum';
import { DataAccessException } from '../../../common/exceptions/quota.exception';

@Injectable()
export class GetQuotaAllocationDetailUseCase {
  private readonly logger = new Logger(GetQuotaAllocationDetailUseCase.name);

  constructor(
    @Inject('QuotaAllocationRepository')
    private readonly quotaAllocationRepository: QuotaAllocationRepositoryPort,
    @Inject('MasterRepository')
    private readonly masterRepository: MasterRepositoryPort,
  ) {}

  async execute(
    allocationId: number,
    language: Language = Language.EN,
  ): Promise<QuotaAllocationDetailResponse> {
    try {
      this.logger.log(
        `Getting allocation detail for ID: ${allocationId}, language: ${language}`,
      );

      // 1. Get allocation detail from repository
      const response =
        await this.quotaAllocationRepository.getAllocationDetail(allocationId);

      // 2. Enrich with common code names
      const [locationTypes, quotaTypes] = await Promise.all([
        this.masterRepository.getCommonCode('QUOTA_LOCATION_TYPE', language),
        this.masterRepository.getCommonCode('QUOTA_TYPE', language),
      ]);

      // Find names from common codes
      const locationTypeItem = locationTypes.find(
        (item) => item.value === response.location_type.value,
      );
      const quotaTypeItem = quotaTypes.find(
        (item) => item.value === response.quota_type.value,
      );

      response.location_type.name = locationTypeItem?.text || '';
      response.quota_type.name = quotaTypeItem?.text || '';

      this.logger.log(
        `Successfully retrieved allocation detail with ${response.round_allocations.length} rounds`,
      );

      return response;
    } catch (error) {
      this.logger.error(`Failed to get allocation detail: ${error.message}`, error.stack);
      if (error instanceof DataAccessException) {
        throw error;
      }
      throw new DataAccessException(
        `Failed to get quota allocation detail: ${error.message}`,
      );
    }
  }
}
