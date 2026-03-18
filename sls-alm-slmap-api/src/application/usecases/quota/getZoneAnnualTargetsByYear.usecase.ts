import { Inject, Injectable } from '@nestjs/common';
import { QuotaAnnualTargetRepositoryPort } from '../../ports/quotaAnnualTarget.repository';
import { QuotaAnnualTargetsResponse } from '../../../domain/quotaAnnualTarget';
import { YearValidator } from '../../../common/helpers/yearValidator';

@Injectable()
export class GetZoneAnnualTargetsByYearUseCase {
  constructor(
    @Inject('QuotaAnnualTargetRepository')
    private readonly quotaAnnualTargetRepository: QuotaAnnualTargetRepositoryPort,
  ) {}

  async execute(year: string): Promise<QuotaAnnualTargetsResponse> {
    // Validate year format (YYYY)
    YearValidator.validate(year);

    const items = await this.quotaAnnualTargetRepository.getZoneAnnualTargetsByYear(year);

    return {
      year,
      items,
    };
  }
}
