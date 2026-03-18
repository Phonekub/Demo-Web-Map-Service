export class QuotaSearch {
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

export class QuotaSearchQuery {
  pendingOnly?: boolean;
  year?: string;
  locationType?: string;
  quotaType?: string;
  round?: string;
  zone?: string;
  status?: string;
}

export class QuotaSearchResponse {
  data: QuotaSearch[];
}

export class QuotaAllocationHistory {
  sequence: number;
  statusName: string;
  action: string;
  remark: string | null;
  actionBy: string;
  actionDate: string;
}

export class QuotaAllocationHistoryResponse {
  data: QuotaAllocationHistory[];
}
