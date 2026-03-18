export class SaveStoreOpeningReportRequest {
  year: string;
  locationTypeList: string;
  quotaTypeList: string;
  zoneList: string;
}

export class QuotaReportOpenPlan {
  id: number;
  name: string;
  year: string;
  locationTypeList: string;
  quotaTypeList: string;
  zoneList: string;
  filePath: string;
  createBy: string;
  createDate: string;
}

export class QuotaReportImpactSite {
  id: number;
  name: string;
  year: string;
  formNoList?: string;
  locationTypeList: string;
  siteTypeList: string;
  zoneList: string;
  radius: string;
  filePath: string;
  status: string;
  createBy: string;
  createDate: string;
}

export class SaveImpactSiteReportRequest {
  year: string;
  formNoList?: string;
  locationTypeList: string;
  siteTypeList: string;
  zoneList: string;
  radius: number;
}

export class SaveReportResponse {
  success: boolean;
  message: string;
  error?: {
    code: string;
    message: string;
  };
}
