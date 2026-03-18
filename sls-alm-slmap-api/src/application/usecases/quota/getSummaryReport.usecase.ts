import { Inject, Injectable } from '@nestjs/common';
import { QuotaAnnualTargetRepositoryPort } from '../../ports/quotaAnnualTarget.repository';
import { QuotaAnnualTargetsResponse } from '../../../domain/quotaAnnualTarget';
import { YearValidator } from '../../../common/helpers/yearValidator';
import { QuotaSummaryReportResponse } from '../../../domain/quotaSummaryReport';
import { QuotaReportRepositoryPort } from '../../ports/quotaReport.repository';

@Injectable()
export class GetSummaryReportUseCase {
  constructor(
    @Inject('QuotaReportRepository')
    private readonly quotaReportRepository: QuotaReportRepositoryPort,
  ) {}

  async execute(
    year: string,
    locationType?: string,
    quotaType?: string,
  ): Promise<QuotaSummaryReportResponse[]> {
    // Validate year format (YYYY)
    YearValidator.validate(year);

    const items = await this.quotaReportRepository.getSummaryReport(
      year,
      locationType,
      quotaType,
    );

    return items;
  }
}
