export class QuotaConfig {
  id: number;
  year: number;
  locationType: LocationType;
  quotaType: QuotaType;
  isClosed: 'Y' | 'N';
  isVisible: 'Y' | 'N';
  annualTargets: ZoneTarget[];
}

export class LocationType {
  id: number;
  value: string;
  name: string;
}

export class QuotaType {
  id: number;
  value: string;
  name: string;
}

export class ZoneTarget {
  zoneId: number;
  zoneCode: string;
  target: number;
  id: number;
  year: number;
  locationType: string;
  quotaType: string;
  isVisible?: string;
  isClosed?: string;
  createBy?: number;
  createDate?: Date;
  updateBy?: number;
  updateDate?: Date;
}

export class YearConfigsResponse {
  year: string;
  locationTypes: string[];
  quotaTypes: string[];
}

export interface QuotaConfigPair {
  year: string;
  locationType: string;
  quotaType: string;
  isVisible: string;
  id?: number;
}
