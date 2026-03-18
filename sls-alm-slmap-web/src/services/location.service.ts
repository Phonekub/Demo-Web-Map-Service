// Location service for fetching location data from the API
import queryString from 'query-string';
import { get, post, put, del } from './httpBase.service';
import type { CoordinateInfoResponse } from '../types/location.type';
import type { InfoComponent } from '@/pages/maps/panel/InfoPanel';
export interface Location {
  id: string;
  uid: string;
  branchName: string;
  branchCode: string;
  location: string;
  geom: {
    type: string;
    coordinates: number[]; // [longitude, latitude]
  };
  area: {
    id: string;
    shape: string;
    coordinates: number[][][]; // [[[longitude, latitude], ...]
  };
  layer?: {
    id: number;
    symbol: string;
  };
  status?: string;
  poiId?: number;
  layerProperties?: string[];
}

export interface LocationInfo {
  branchName?: string;
  branchCode?: string;
  geom?: {
    type: string;
    coordinates: number[]; // [longitude, latitude]
  };
}

export interface LocationsResponse {
  data: {
    search: Location[];
    poi: {
      id: number;
      name: string;
      coordinates: number[];
      radius?: number;
      symbol?: string;
    }[];
  };
  total: number;
  params?: {
    type?: string;
    [key: string]: any;
  };
}

export interface TradeAreaPolygon {
  id: number;
  storeName: string;
  shape: {
    type: string;
    coordinates: number[][][];
  };
  areaColor: string;
  status: string;
  zoneCode: string;
}

export interface TradeAreaSpatialResponse {
  data: TradeAreaPolygon[];
  total: number;
}

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface UpdateAreaRequest {
  poiId: number;
  coordinates: Coordinate[];
}

/**
 * Fetch all locations from the API
 * @returns Promise<LocationsResponse>
 */
export const fetchLocations = async (
  params: Record<string, any>
): Promise<LocationsResponse> => {
  const path = queryString.stringifyUrl(
    {
      url: '/locations',
      query: params,
    },
    { skipNull: true, skipEmptyString: true }
  );

  return get<LocationsResponse>(path);
};

/**
 * Fetch a specific location by ID
 * @param id - Location ID
 * @returns Promise<Location>
 */
export const fetchLocationById = async (id: number): Promise<Location> => {
  return get<Location>(`/locations/${id}`);
};

/**
 * Create a new location
 * @param locationData - Location data to create
 * @returns Promise<Location>
 */
export const createLocation = async (
  locationData: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Location> => {
  return post<Location, Omit<Location, 'id' | 'createdAt' | 'updatedAt'>>(
    '/locations',
    locationData
  );
};

/**
 * Update an existing location
 * @param id - Location ID
 * @param locationData - Updated location data
 * @returns Promise<Location>
 */
export const updateLocation = async (
  id: number,
  locationData: Partial<Omit<Location, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Location> => {
  return put<Location, Partial<Omit<Location, 'id' | 'createdAt' | 'updatedAt'>>>(
    `/locations/${id}`,
    locationData
  );
};

/**
 * Delete a location by ID
 * @param id - Location ID
 * @returns Promise<void>
 */
export const deleteLocation = async (id: number): Promise<void> => {
  return del(`/locations/${id}`);
};

/**
 * Fetch locations within a spatial area
 * @param spatialType - Type of location to search (e.g., 'sevenEleven')
 * @param coordinates - Array of coordinate pairs [lng, lat]
 * @returns Promise<LocationsResponse>
 */
export const fetchSpatialLocations = async (
  spatialType: string,
  coordinates: Array<[number, number]>
): Promise<LocationsResponse> => {
  return post<
    LocationsResponse,
    { type: string; spatialType: string; coordinates: Array<[number, number]> }
  >('locations/spatial', {
    type: 'spatial',
    spatialType,
    coordinates,
  });
};

/**
 * Update area coordinates for a specific location
 * @param requestData - Area update request data
 * @returns Promise<void>
 */
export const updateLocationArea = async (
  requestData: UpdateAreaRequest
): Promise<void> => {
  return post<void, UpdateAreaRequest>('locations/area', requestData);
};

export interface POIPoint {
  id: string;
  refStoreCode: string;
  zoneCode: string;
  subzoneCode: string;
  status: string;
  effectiveDate: string | null;
  shape: {
    type: 'Polygon';
    coordinates: number[][][]; // Polygon coordinates
  };
  storeName: string;
  areaColor: string;
  comment: string;
  warning: string;
  globalId: string;
  createdAt: string;
  createUser: string;
  updatedAt: string;
  updateUser: string;
  refPointX: number;
  refPointY: number;
  coordinates: number[][] | number[][][][];
  layerProperties?: string[];
}

export interface FetchPOIByLayerParams {
  layerIds: string[]; // Array of layer IDs
  coordinates: Array<[number, number]>; // 5 coordinates forming a polygon (last === first)
  spatialType?: string; // Optional spatial type, default to 'poiByLayer'
}

/**
 * Fetch POI points by layer IDs and map bounds
 * @param params - Layer IDs and boundary coordinates
 * @returns Promise<POIPoint[]>
 */
export const fetchPOIByLayer = async (
  params: FetchPOIByLayerParams
): Promise<POIPoint[]> => {
  // API returns { data: POIPoint[], total: number }
  const response = await post<
    { data: { poi: POIPoint[] }; total: number },
    { spatialType: string; coordinates: Array<[number, number]>; layerIds: string[] }
  >('locations/spatial', {
    spatialType: params.spatialType || 'tradearea',
    coordinates: params.coordinates,
    layerIds: params.layerIds,
  });
  console.log(response.data);
  return response.data.poi;
};

// Interface for competitor store details
export interface CompetitorStoreDetail {
  seqNo: number;
  codeMapping: string;
  typeName: string;
  typeNameTh: string;
  typeNameEn: string;
  typeNameKh: string;
  count: number;
}

export interface CompetitorStoresResponse {
  stores: CompetitorStoreDetail[];
  total: number;
}

/**
 * Fetch competitor stores around a 7-11 location
 * @param sevenPoiUid - The UID of the 7-11 store POI
 * @returns Promise<CompetitorStoresResponse>
 */
export const fetchCompetitorStores = async (
  sevenPoiUid: string
): Promise<CompetitorStoresResponse> => {
  const response = await get<{
    data: CompetitorStoreDetail[];
    total: number;
  }>(`/locations/${sevenPoiUid}/competitors`);

  const stores = response.data || [];

  return {
    stores,
    total: stores.reduce((sum, s) => sum + s.count, 0),
  };
};

// POI Type Enum
export type PoiType = 'ENVIRONMENT' | 'POTENTIAL';

// ==================== Environment Interfaces ====================

export interface EnvironmentData {
  name: string;
  address?: string;
  category: number;
  subCategory?: number;
}

// ==================== Potential Interfaces ====================

export interface PotentialData {
  name: string;
  address?: string;
  tradeType?: string;
  locationType: string;
  areaType?: string;
  alcoholSale?: number;
  cigaretteSale?: number;
  zoneCode?: string;
  subZoneCode?: string;
  status?: string;
  approveStatus?: string;
  grade?: string;
}

export interface Dimension {
  width?: string;
  length?: string;
  saleArea?: string;
  stockArea?: string;
  storeArea?: string;
}

export interface SevenData {
  name?: string;
  storeCode?: string;
  standardLayout?: string;
  estimateDateOpen?: string;
  preparationType?: string;
  impactType?: string;
  impactDetail?: string;
  investmentType?: string;
  storeBuildingType?: string;
  dimension?: Dimension;
  parkingCount?: string;
}

export interface VendingData {
  businessTypeCode?: string;
  parentBranchCode?: string;
  name?: string;
  serialNumber?: string;
  model?: string;
  motherStoreName?: string;
  vendingCode?: string;
  vendingType?: number | string | null;
  machineId?: string;
  installationType?: string;
  position?: string;
  floor?: string;
  address?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  serviceStartDate?: string;
  serviceEndDate?: string;
  contractCancelDate?: string;
}

// ==================== Main Create POI Request Interface ====================

export interface CreatePoiRequest {
  type: PoiType;
  latitude: number;
  longitude: number;
  subzone: string;
  zone: string;
  environment?: EnvironmentData; // Required when type is 'environment'
  potential?: PotentialData; // Required when type is 'potential'
  seven?: SevenData; // Optional for potential type
  vending?: VendingData; // Optional for potential type
}

// Interface for POI potential creation request (legacy - keeping for backwards compatibility)
export interface PoiPotentialRequest {
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  address: string;
  description?: string;
  phone?: string;
  openingHours?: string;
  tags?: string[];
  zoneCode: string;
}

export interface PoiPotentialResponse {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  address: string;
  description?: string;
  phone?: string;
  openingHours?: string;
  tags?: string[];
  zoneCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface SevenElevenNearbyData {
  id: string;
  uid: string;
  branchName: string;
  branchCode: string;
  location: string;
  layerId: number;
  formLocNumber: string;
  sevenType: number;
  sevenTypeName: string;
  distance: number;
  saleAverage: number;
}

export interface CompetitorNearbyData {
  id: number;
  uid: string;
  branchName: string;
  branchCode: string;
  location: string;
  grade: string;
  distance: number;
  saleAverage: number;
  openTime: string;
  closeTime: string;
  competitorType: number;
  competitorTypeName: string;
  competitorLayerId: number;
}

export interface EntertainmentNearbyData {
  id: number;
  uid: string;
  branchName: string;
  branchCode: string;
  location: string;
  distance: number;
  openTime: string | null;
  closeTime: string | null;
  subCode: string;
  storeType: string;
  personAmount: number | null;
  parkingAmount: number | null;
  workingDay: string | null;
  goodsType: string;
}

/**
 * Create a new POI potential location
 * @param poiData - POI potential data to create
 * @returns Promise<PoiPotentialResponse>
 */
export const createPoiPotential = async (
  poiData: CreatePoiRequest
): Promise<PoiPotentialResponse> => {
  return post<PoiPotentialResponse, CreatePoiRequest>('locations/poi', poiData);
};

export const fetchCoordinateInfo = async (
  latitude: number,
  longitude: number
): Promise<{ data: CoordinateInfoResponse }> => {
  const path = queryString.stringifyUrl({
    url: '/locations/coordinate-info',
    query: { latitude, longitude },
  });
  return get<{ data: CoordinateInfoResponse }>(path);
};

export interface BackupProfilePoiItem {
  id: number | string;
  name: string;
  namt: string;
  branchName: string;
  branchCode: string;
  location: string;
  layerId: number;
  layerName: string;
  layerTh: string;
  layerEn: string;
  layerKh: string;
  subCode: string;
  geom: string | null;
  area: string | null;
  profileSubCategoryId: number;
  formConfigId: number;

  // ถ้า API ของจริงมี stats/coords ให้เปิดไว้เป็น optional
  coordinates?: number[];
  population?: number;
  customers?: number;
  percentPredictCustomer?: number;
  populationAmount?: number;
  customerAmount?: number;
  percent_predict_customer?: number;
}

export interface BackupProfileSubCategory {
  profileSubCategoryId: number;
  formConfigId: string;
  pois: BackupProfilePoiItem[];
}

export interface BackupProfileLayer {
  layerId: number;
  layerName: string;
  layerTh?: string;
  layerEn?: string;
  layerKh?: string;
  subCategories: BackupProfileSubCategory[];
}

// Interface for Backup Profile response
export interface BackupProfileLayersResponse {
  data: {
    layers: BackupProfileLayer[];
  };
  total: number;
}

/**
 * Fetch POIs grouped by layer for backup profile within a spatial area
 * @param coordinates - Array of coordinate pairs [lng, lat]
 * @returns Promise<BackupProfileLayersResponse>
 */
export const fetchBackupProfileLayers = async (
  coordinates: Array<[number, number]>
): Promise<BackupProfileLayersResponse> => {
  return post<
    BackupProfileLayersResponse,
    { spatialType: string; coordinates: Array<[number, number]> }
  >('locations/spatial', {
    spatialType: 'backupProfile',
    coordinates,
  });
};

export const fetchSevenNearby = async (
  lat: number,
  long: number,
  distance: number
): Promise<SevenElevenNearbyData[]> => {
  const response = await get<{ data: SevenElevenNearbyData[] }>(
    `/locations/nearby-seven?lat=${lat}&long=${long}&distance=${distance}`
  );
  return response.data;
};

export const fetchCompetitorNearby = async (
  lat: number,
  long: number,
  distance: number
): Promise<CompetitorNearbyData[]> => {
  const response = await get<{ data: CompetitorNearbyData[] }>(
    `/locations/nearby-competitor?lat=${lat}&long=${long}&distance=${distance}`
  );
  return response.data;
};

export const fetchEntertainmentNearby = async (
  lat: number,
  long: number,
  distance: number
): Promise<EntertainmentNearbyData[]> => {
  const response = await get<{ data: EntertainmentNearbyData[] }>(
    `/locations/nearby-entertainment-area?lat=${lat}&long=${long}&distance=${distance}`
  );
  return response.data;
};

export const fetchTradeAreasForMap = async (
  coordinates: Array<[number, number]>
): Promise<TradeAreaSpatialResponse> => {
  return post<
    TradeAreaSpatialResponse,
    { spatialType: string; coordinates: Array<[number, number]>; boundaryArea: any[] }
  >('locations/spatial', {
    spatialType: 'tradearea',
    coordinates,
    boundaryArea: [],
  });
};

export interface Poi {
  id: number;
  uid: string;
  layerId: number;
  layerProperties: InfoComponent[];
}
export const fetchPoiByPoiId = async (id: number): Promise<Poi> => {
  const response = await get<{ data: Poi }>(`/locations/${id}`);
  return response.data;
};

export interface FetchPotentialResponse {
  poi: Poi;
  potentialStore: PotentialStore | null;
  sevenEleven: SevenEleven | null;
  vendingMachine: VendingMachine | null;
}

export interface Poi {
  poiId: number;
  uid: string;
  layerId: number;
  namt: string;
  name: string;
  locationT: string;
  locationE: string;
  zoneCode: string;
  subzoneCode: string;
  nation: string;
  provCode: string;
  ampCode: string;
  tamCode: string;
  shape: Shape;
  isActive: 'Y' | 'N';
  createdUser: string;
  createdDate: string;
  lastEditedUser: string;
  lastEditedDate: string;
}

export interface Shape {
  type: string;
  coordinates: [number, number];
}

export interface PotentialStore {
  id: string;
  uid: string;
  poiId: number;
  formLocNumber: string;
  locationType: string | null;
  rentType: string;
  isActive: 'Y' | 'N';
  canSaleAlcohol: 'Y' | 'N';
  canSaleCigarette: 'Y' | 'N';
  createdDate: string;
  createdBy: string | null;
  updatedDate: string;
  status: string;
  approveStatus: string;
  areaType: string | null;
  wfTransactionId: string | null;
  grade: string | null;
}

export interface SevenEleven {
  id: number;
  potentialStoreId: number;
  storecode: string | null;
  storeCode?: string;
  name: string | null;
  impactTypeSite: number;
  impactDetail: string | null;
  estimateDateOpen: string | null;
  storeWidth: number | null;
  storeLength: number | null;
  saleArea: number | null;
  stockArea: number | null;
  storeArea: number | null;
  parkingCount: number | null;
  storeBuildingType: number | null;
  storeFranchise: number | null;
  createdDate: string;
  createdBy: number | null;
  updatedDate: string;
  standardLayout: string | null;
}

export interface VendingMachine {
  id: number;
  potentialStoreId: number;
  elementNumber: string | null;
  storecode: string | null;
  machineId: string | null;
  serialNumber: string | null;
  name: string | null;
  vendingModel: string | null;
  vendingType: string | null;
  floor: string | null;
  locationAddress: string | null;
  openDate: string | null;
  closeDate: string | null;
  contractStartDate: string | null;
  contractFinishDate: string | null;
  contractCancelDate: string | null;
  targetPoint: number | null;
  maintenanceType: string | null;
  businessTypeCode: string | null;
  isActive: string;
  createdDate: string;
  createdBy: number | null;
  updatedDate: string;
  motherStoreName?: string;
}

export const fetchPotentialByPoiId = async (
  id: number
): Promise<FetchPotentialResponse> => {
  const response = await get<{ data: FetchPotentialResponse }>(`/potentials/poi/${id}`);
  return response.data;
};

export interface UpDatePOIRes {
  poi: Poi;
  potentialStore: PotentialStore | null;
  sevenEleven: SevenEleven | null;
  vendingMachine: VendingMachine | null;
}

export interface UpdatePoiRequest {
  type: PoiType;
  latitude: number;
  longitude: number;
  environment?: EnvironmentData; // Required when type is 'environment'
  potential?: PotentialData; // Required when type is 'potential'
  seven?: SevenData; // Optional for potential type
  vending?: VendingData; // Optional for potential type
}
export const updatePOIPotential = async (
  id: number,
  data: UpdatePoiRequest
): Promise<UpDatePOIRes> => {
  const response = await put<{ data: UpDatePOIRes }>(`locations/poi/${id}`, data);
  return response.data;
};

export type fetchSeven = Pick<
  SevenElevenNearbyData,
  'id' | 'branchName' | 'branchCode' | 'distance'
>;

export const fetchSevenByName = async (name: string): Promise<fetchSeven[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const mockData: SevenElevenNearbyData[] = [
        {
          id: '101',
          uid: 'uid-name-001',
          branchName: `7-Eleven ${name || 'บางบอน'} (จุดที่ 1)`,
          branchCode: '50001',
          location: '13.8000, 100.5500',
          layerId: 1,
          formLocNumber: 'LOC-NAME-001',
          sevenType: 1,
          sevenTypeName: 'Stand Alone',
          distance: 120.0,
          saleAverage: 55000.0,
        },
        {
          id: '102',
          uid: 'uid-name-002',
          branchName: `7-Eleven ${name || 'บางบอน'} (หน้าตลาด)`,
          branchCode: '50002',
          location: '13.8050, 100.5550',
          layerId: 2,
          formLocNumber: 'LOC-NAME-002',
          sevenType: 3,
          sevenTypeName: 'Shop in Shop',
          distance: 450.5,
          saleAverage: 32000.0,
        },
        {
          id: '103',
          uid: 'uid-name-003',
          branchName: `7-Eleven ปากซอย${name || 'บางบอน'}`,
          branchCode: '50003',
          location: '13.8100, 100.5600',
          layerId: 1,
          formLocNumber: 'LOC-NAME-003',
          sevenType: 1,
          sevenTypeName: 'Stand Alone',
          distance: 890.0,
          saleAverage: 48500.25,
        },
      ];

      resolve(mockData);
    }, 500);
  });
};

export const fetchSevenByStoreCode = async (
  storeCode: string
): Promise<SevenElevenNearbyData[]> => {
  // ต้องมี return เพื่อส่ง Promise กลับออกไป
  return new Promise(resolve => {
    setTimeout(() => {
      const mockData: SevenElevenNearbyData[] = [
        {
          id: '1',
          uid: 'uuid-1001',
          branchName: '7-Eleven สาขา ปากซอย 1 (Mock)',
          branchCode: storeCode || '13003',
          location: '13.7563, 100.5018',
          layerId: 1,
          formLocNumber: 'LOC-1001',
          sevenType: 1,
          sevenTypeName: 'Stand Alone',
          distance: 150.5,
          saleAverage: 45000.0,
        },
        {
          id: '2',
          uid: 'uuid-1002',
          branchName: '7-Eleven สาขา ตลาดสด (Mock)',
          branchCode: '04053',
          location: '13.7600, 100.5050',
          layerId: 2,
          formLocNumber: 'LOC-1002',
          sevenType: 2,
          sevenTypeName: 'In Gas Station',
          distance: 500.0,
          saleAverage: 62000.5,
        },
      ];

      resolve(mockData);
    }, 500);
  });
};

export interface SevenInfoResponse {
  storecode: string | null;
  storename: string | null;
  locationT: string | null;
  tradeArea: string | null;
  branchType: string | null;
  sevenType: string | null;
  contractStartDate: string | null;
  contractEndDate: string | null;
  storeWidth: string | null;
  storeLength: string | null;
  saleArea: string | null;
  stockArea: string | null;
  storeArea: string | null;
  storeBuildingType: string | null;
  roomAmount: string | null;
  storeParking: string | null;
  storeParkingMotocycle: string | null;
  openDate: string | null;
  closeDate: string | null;
  officeHours: string | null;
  renovateStartDate: string | null;
  renovateEndDate: string | null;
  tempcloseStartDate: string | null;
  tempcloseEndDate: string | null;
  saleAverage: string | null;
  customerAverage: string | null;
  salePricePerson: string | null;
  opentypeAmount: string | null;
  vaultAmount: string | null;
  shelf: string | null;
  posAmount: string | null;
  canSaleCigarette: string | null;
  canSaleAlcohol: string | null;
}

export const fetchSevenInfoByPoiId = async (
  poiId: number
): Promise<SevenInfoResponse | null> => {
  const response = await get<{ data: SevenInfoResponse | null }>(
    `/seven-profile/poi/${poiId}`
  );
  return response.data;
};
