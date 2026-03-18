export class QuotaAnnualTarget {
  id: number;
  quotaConfigId: number;
  locationType: string;
  quotaType: string;
  zoneId: number;
  target: number;

  zoneCode?: string;
  locationTypeName?: string;
  quotaTypeName?: string;
}

export class QuotaAnnualTargetsResponse {
  year: string;
  items: QuotaAnnualTarget[];
}

export class ZoneTarget {
  zoneId: number;
  locationType: string;
  quotaType: string;
  target: number;
}

export class SaveAnnualQuotaRequest {
  year: string;
  locationTypes: string[];
  quotaTypes: string[];
  zoneTargets?: ZoneTarget[];
}

export class SaveAnnualQuotaResponse {
  success: boolean;
  error?: {
    code: string;
    message?: string;
  };
}
