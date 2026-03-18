import { Inject, Injectable } from '@nestjs/common';
import { QuotaConfigRepositoryPort } from '../../ports/quotaConfig.repository';
import { YearConfigsResponse } from '../../../domain/quotaConfig';
import { YearValidator } from '../../../common/helpers/yearValidator';

@Injectable()
export class GetYearConfigsUseCase {
  constructor(
    @Inject('QuotaConfigRepository')
    private readonly quotaConfigRepository: QuotaConfigRepositoryPort,
  ) {}

  async execute(year: string): Promise<YearConfigsResponse> {
    // Validate year format (YYYY)
    YearValidator.validate(year);

    return await this.quotaConfigRepository.getYearConfigs(year);
  }
}
