import { get, post } from '@/services/httpBase.service';

export interface QuotaRoundOption {
  value: string;
  text: string;
}

export interface QuotaSearchParams {
  pendingOnly?: boolean;
  year?: string;
  locationType?: string;
  quotaType?: string;
  round?: string;
  zone?: string;
  status?: string;
}

export interface QuotaAllocation {
  id: number;
  year: string;
  locationTypeName: string;
  quotaTypeName: string;
  round: string;
  zone: string;
  keyed: number;
  quota: number;
  statusName: string;
}

export interface QuotaSearchResponse {
  data: QuotaAllocation[];
  total: number;
}

export interface QuotaHistory {
  sequence: number;
  statusName: string;
  action: string;
  remark: string | null;
  actionBy: string;
  actionDate: string;
}

export interface QuotaHistoryResponse {
  data: QuotaHistory[];
}

export interface ApproveResult {
  id: number;
  success: boolean;
  message?: string;
}
export interface CheckHistoryResponse {
  success: boolean;
  isUsed: boolean;
}

export interface QuotaHistoryItem {
  detail: string;
  remark: string | null;
  created_by_name: string;
  created_date: string;
}

export interface QuotaItemHistoryResponse {
  history: QuotaHistoryItem[];
}

export const fetchQuotaRounds = async (year: number): Promise<QuotaRoundOption[]> => {
  const response = await get<{ data: QuotaRoundOption[] }>(`/quotas/rounds?year=${year}`);
  return response.data;
};

export const searchQuotaAllocations = async (
  params: QuotaSearchParams
): Promise<QuotaSearchResponse> => {
  const queryParams = new URLSearchParams();

  if (params.pendingOnly === true) queryParams.append('pendingOnly', 'true');
  if (params.year) queryParams.append('year', params.year);
  if (params.locationType && params.locationType !== 'ALL')
    queryParams.append('locationType', params.locationType);
  if (params.quotaType && params.quotaType !== 'ALL')
    queryParams.append('quotaType', params.quotaType);
  if (params.round && params.round !== 'ALL') queryParams.append('round', params.round);
  if (params.zone && params.zone !== 'ALL') queryParams.append('zone', params.zone);
  if (params.status && params.status !== 'ALL')
    queryParams.append('status', params.status);

  const response = await get<QuotaSearchResponse>(`/quotas?${queryParams.toString()}`);

  return response;
};

export const fetchQuotaHistory = async (id: number): Promise<QuotaHistory[]> => {
  const response = await get<QuotaHistoryResponse>(`/quotas/${id}/history`);
  return response.data;
};

export const approveQuotaAllocations = async (
  ids: number[]
): Promise<ApproveResult[]> => {
  const response = await post<ApproveResult[]>('quotas/approve', ids);
  return response;
};

export const rejectQuotaAllocations = async (
  ids: number[],
  reason: string
): Promise<ApproveResult[]> => {
  const response = await post<ApproveResult[]>('quotas/reject', { ids, reason });
  return response;
};

export const checkLocationHistory = async (
  poiId: number
): Promise<CheckHistoryResponse> => {
  return await get<CheckHistoryResponse>(`/quotas/check-history/${poiId}`);
};

export const fetchQuotaItemHistory = async (id: number): Promise<QuotaHistoryItem[]> => {
  const response = await get<QuotaItemHistoryResponse>(`/quotas/items/${id}/history`);
  return response.history; 
};