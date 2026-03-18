import { Inject, Injectable } from '@nestjs/common';
import { QuotaReportRepositoryPort } from '../../ports/quotaReport.repository';
import { QuotaReportOpenPlan } from '../../../domain/quotaReport';

@Injectable()
export class GetAllReportOpenPlanUseCase {
  constructor(
    @Inject('QuotaReportRepository')
    private readonly quotaReportRepository: QuotaReportRepositoryPort,
  ) {}

  async handler(
    search: string,
    page?: number,
    pageSize?: number,
  ): Promise<{ data: QuotaReportOpenPlan[]; total: number }> {
    return await this.quotaReportRepository.getAll(search, page, pageSize);
  }
}
