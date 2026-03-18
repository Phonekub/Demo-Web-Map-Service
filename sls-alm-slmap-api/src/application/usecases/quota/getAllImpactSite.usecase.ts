import { Inject, Injectable } from '@nestjs/common';
import { QuotaReportRepositoryPort } from '../../ports/quotaReport.repository';
import { QuotaReportImpactSite } from '../../../domain/quotaReport';

@Injectable()
export class GetAllReportImpactSiteUseCase {
  constructor(
    @Inject('QuotaReportRepository')
    private readonly quotaReportRepository: QuotaReportRepositoryPort,
  ) {}

  async handler(
    search: string,
    page?: number,
    pageSize?: number,
  ): Promise<{ data: QuotaReportImpactSite[]; total: number }> {
    return await this.quotaReportRepository.getAllImpactSite(search, page, pageSize);
  }
}
