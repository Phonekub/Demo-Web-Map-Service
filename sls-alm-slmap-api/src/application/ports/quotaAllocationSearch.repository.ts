import { QuotaSearch, QuotaSearchQuery } from '../../domain/quotaSearch';

export interface QuotaAllocationSearchRepositoryPort {
  searchQuotas(
    query: QuotaSearchQuery,
    userZones: string[],
    userId?: number,
    roleId?: number,
  ): Promise<[QuotaSearch[]]>;
}
