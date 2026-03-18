import {
  QuotaReportOpenPlan,
  SaveImpactSiteReportRequest,
  SaveStoreOpeningReportRequest,
  QuotaReportImpactSite,
} from '../../domain/quotaReport';
import { QuotaSummaryReportResponse } from '../../domain/quotaSummaryReport';

export interface QuotaReportRepositoryPort {
  getSummaryReport(
    year: string,
    locationType: string,
    quotaType: string,
  ): Promise<QuotaSummaryReportResponse[]>;

  saveStoreOpeningReport(
    request: SaveStoreOpeningReportRequest,
    userId: number,
  ): Promise<void>;

  getAll(
    search: string,
    page?: number,
    pageSize?: number,
  ): Promise<{ data: QuotaReportOpenPlan[]; total: number }>;

  saveImpactSiteReport(
    request: SaveImpactSiteReportRequest,
    userId: number,
  ): Promise<void>;

  getAllImpactSite(
    search: string,
    page?: number,
    pageSize?: number,
  ): Promise<{ data: QuotaReportImpactSite[]; total: number }>;

  deleteReportImpactSite(reportId: number, userId: number): Promise<void>;
}
