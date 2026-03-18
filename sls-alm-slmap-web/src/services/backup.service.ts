import { get, post, put } from './httpBase.service';

export interface BackupProfile {
  id: number;
  uid: string;
  parentLayer: number;
  poiId: string;
  formLocNumber: string;
  zoneCode: string;
  shape: {
    type: string;
    coordinates: number[][][];
  };
  backupColor: number;
  backupColorLayer: string;
  isActive: string;
  mainProfile: string;
  subProfile: string;
  areaSize: string;
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
  createDate: string;
  createBy: number;
  updateDate: string;
  updateBy: number;
  profiles: Array<{
    id: number;
    backupLocationId: number;
    profileLayerId: number;
    backupPercentage: number;
    profileLayerName: string;
  }>;
  profilePois: Array<{
    id: number;
    backupLocationProfileId: number;
    backupLocationId: number;
    profileLayerId: number;
    poiId: number;
    distance: string;
    populationAmount: number;
    customerAmount: number;
    percentPredictCustomer: number;
    poiNamt: string;
  }>;
  competitors: Array<{
    id: number;
    backupLocationId: number;
    competitorLayerId: number;
    competitorId: number;
    distance: number;
    competitorType: number;
    competitorTypeName: string;
    grade: string;
  }>;
}

export interface RentalLocationData {
  formLocNumber: string;
  branchId: string;
  branchName: string | null;
  locationName: string;
  zoneCode: string;
  areaCode: string;
  formLocType: string;
  surveyName: string;
  surveyDate: string;
  surveyTel: string;
  locationType: string;
  locationTypeCode: string | null;
  storeStatus: string | null;
  storeStatusType: string | null;
  relocateType: string | null;
  relocateFrom: string | null;
  businessType: string | null;
  businessSubType1: string;
  businessSubType2: string;
  businessSubType3: string;
  businessSubType4: string;
  locTarget: string | null;
  deedNumber: string | null;
  deedPropNo: string | null;
  deedFrontSurvey: string | null;
  addrNo: string | null;
  addrMoo: string | null;
  addrSoi: string | null;
  addrRoad: string;
  addrSubDistrict: string;
  addrDistrict: string;
  addrProvinceId: string;
  addrPostCode: string;
  isBuilding: string;
  bldFloor: string;
  bldBlock: string;
  bldWidth: string;
  bldDepth: string;
  bldTotalArea: string;
  bldAreaUnit: string;
  bldBack: string;
  bldBackWidth: string | null;
  bldBackDepth: string | null;
  isLand: string;
  landWidth: string | null;
  landDepth: string | null;
  landTotalArea: string | null;
  landAreaUnit: string | null;
  earningRate: string;
  statusId: string;
  commentSiteStatus: string;
  waterStatus: string;
  storeDesignAllow: string;
  checkDiffFlag: string;
  createUser: string;
  createDate: number;
  updateUser: string | null;
  updateDate: number;
  deleteFlag: string;
  deleteUser: string | null;
  deleteDate: number | null;
  offerLocNumber: string | null;
  storePttNumber: string | null;
  commentSiteNumber: string;
  formLocTypeInitial: string;
  oldBusiness: string | null;
  wfVersionId: string;
  ctsNumber: string | null;
  wfId: string;
  appr1AvgCust: string | null;
  appr1AvgSale: string;
  appr1AvgHead: string | null;
  responseUsername: string | null;
  waterNoteNumber: string | null;
  businessCode: string | null;
  latitude: string;
  longitude: string;
  forbidProductDetail: string | null;
  forbidType: string;
  cigaretteIndicator: string | null;
  alcoholIndicator: string | null;
  formLocNumberMergeRef: string | null;
  deepNumber: string | null;
  deepPropNo: string | null;
  deepFrontSurvey: string | null;
  zoneName: string | null;
  areaName: string | null;
  zoneArea: string | null;
  canDelete: string | null;
  updateUserDesc: string | null;
  rentPeriod: string | null;
  rentRate: string | null;
  cashOther: string | null;
  utilityDetail: string | null;
  taxDetail: string | null;
  insuranceDetail: string | null;
  otherDetail: string | null;
  openDate: string | null;
  provinceName: string;
  districtName: string;
  createSystem: string | null;
  profileLocation: string;
  profileLocationName: string | null;
  profileLocationType: string | null;
  username: string | null;
  populationProvince: string;
  populationTambon: string | null;
  populationAmphur: string;
  maleProvince: string;
  maleTambon: string | null;
  maleAmphur: string;
  femaleProvince: string;
  femaleTambon: string | null;
  femaleAmphur: string;
  globalId: string | null;
  elementList: any | null;
  locationTypeName: string | null;
}

export const fetchBackupProfile = async (poiId: string): Promise<BackupProfile> => {
  return await get<BackupProfile>(`/backupprofile/${poiId}`);
};

export const updateBackupProfile = async (
  uid: string,
  data: any
): Promise<BackupProfile> => {
  return await put<BackupProfile, any>(`backupprofile/${uid}`, data);
};

export const createBackupProfile = async (data: any): Promise<BackupProfile> => {
  return await post<BackupProfile, any>(`backupprofile`, data);
};

export const fetchRentalLocation = async (fl: any): Promise<RentalLocationData> => {
  return await get<RentalLocationData>(`/rental/getLocation?fl=${fl}`);
};

export interface DynamicFormField {
  FIELD_ID: string;
  TITLE?: string;
  INPUT_TYPE: string;
  DATA_TYPE?: string;

  VALUE?: any;
  VALUE_JSONB?: any;

  IS_REQUIRED?: boolean;

  LIST_VALUE?: string;

  VALIDATE_MIN?: number | null;
  VALIDATE_MAX?: number | null;

  IS_SHOW_PERCENT?: boolean | null;
  IS_SHOW_TOTAL?: boolean | null;
  TOTAL_TITLE?: string | null;
  VALIDATE_TOTAL_MIN?: number | null;
  VALIDATE_TOTAL_MAX?: number | null;
}

export interface DynamicFormBody {
  fields?: DynamicFormField[];
  FORM_TITLE?: string;
  FORM_VERSION_ID?: string | number;
  REFERENCE_OBJ?: string;
  REFERENCE_KEY?: string;
  CREATED_USER?: string;
  Form_ID?: number;
}

export interface DynamicFormApiResponse extends DynamicFormBody {
  form?: DynamicFormBody;
  success?: boolean;
  error?: any;
}

export interface DynamicFormUpsertPayload {
  formVersionId: number;
  poiId: string;
  referenceObj: string;
  referenceKey: string;
  createdUser?: string;
  LastEditsUser?: string;
  fields: Array<{
    FIELD_ID: string;
    DATA_TYPE?: string;
    VALUE: any;
  }>;
}

// export const fetchDynamicFormById = async (
//   formId: number
// ): Promise<DynamicFormApiResponse> => {
//   return await get<DynamicFormApiResponse>(`/dynamicform/getForm/${formId}`);
// };

export const fetchDynamicForm = async (
  obj: string,
  key: string
): Promise<DynamicFormApiResponse> => {
  return await get<DynamicFormApiResponse>(`/dynamicform/getForm/${obj}/${key}`);
};

// export const fetchDynamicBlankForm = async (
//   configId: number
// ): Promise<DynamicFormApiResponse> => {
//   return await get<DynamicFormApiResponse>(`/dynamicform/getBlankForm/${configId}`);
// };

export const fetchDynamicBlankFormBySubzone = async (
  subcode: string
): Promise<DynamicFormApiResponse> => {
  return await get<DynamicFormApiResponse>(`/backupprofile/getBlankForm/${subcode}`);
};

export const createDynamicForm = async (
  payload: DynamicFormUpsertPayload
): Promise<any> => {
  return await post<any, DynamicFormUpsertPayload>(`dynamicform/`, payload);
};

export const updateDynamicForm = async (
  formId: number,
  payload: DynamicFormUpsertPayload
): Promise<any> => {
  return await put<any, DynamicFormUpsertPayload>(`dynamicform/${formId}`, payload);
};
