export class BackupProfile {
  id: number;
  uid: string;
  poiLayerId: number;
  poiId: number;
  formLocNumber: string;
  zoneCode: string;
  shape: string;
  backupColor: number;
  backupColorLayer: string;
  isActive: string;
  mainProfile: string;
  subProfile: string;
  areaSize: number;
  backupRemark: string;
  strategicLocation: string;
  strategicSupport: string;
  strategicPlace: string;
  strategicPlaceOther: string;
  strategicPlaceName: string;
  strategicPlaceGuid: string;
  strategicPosition: string;
  strategicPositionOther: string;
  strategicPositionName: string;
  strategicFloor: string;
  strategicFloorOther: string;
  strategicCustomerType: string;
  strategicHousingType: string;
  strategicIndustrialEstateName: string;
  streetFood: string;
  createDate: Date;
  createBy: number;
  updateDate: Date;
  updateBy: number;
  profiles: BackupLocationProfile[];
  profilePois: BackupLocationProfilePoi[];
  competitors: BackupLocationCompetitor[];
}

export class BackupLocationProfile {
  id: number;
  backupLocationId: number;
  profileLayerId: number;
  backupPercentage: number;
  profileLayerName?: string;
}

export class BackupLocationProfilePoi {
  id: number;
  backupLocationProfileId: number;
  backupLocationId: number;
  poiId: number;
  profileLayerId: number;
  distance: string;
  populationAmount: number;
  customerAmount: number;
  percentPredictCustomer: number;
  poiNamt?: string;
}

export class BackupLocationCompetitor {
  id: number;
  backupLocationId: number;
  competitorLayerId: number;
  competitorId: number;
  distance: number;
  competitorType: number;
  competitorTypeName?: string;
  grade?: string;
  openTime?: string;
  closeTime?: string;
  saleAverage?: number;
}
