import { Poi } from '../../domain/poi';
import { MasterCpallZone } from '../../domain/masterCpallZone';
import { PotentialPendingApproval } from '../../domain/potentialPendingApproval';
import { AreaEntity } from '../../adapter/outbound/repositories/entities/area.entity';
import { PoiEntity } from '../../adapter/outbound/repositories/entities/poi.entity';
import { PoiPotentialEntity } from '../../adapter/outbound/repositories/entities/potential.entity';
import { ElementSevenElevenEntity } from '../../adapter/outbound/repositories/entities/elementSevenEleven.entity';
import { ElementVendingMachineEntity } from '../../adapter/outbound/repositories/entities/elementVendingMachine.entity';
import {
  ClosedStoreSearchQuery,
  CompetitorSearchQuery,
  OtherPlaceSearchQuery,
  PotentialSearchQuery,
  SevenElevenSearchQuery,
  SevenImpactCompetitorSearchQuery,
  VendingMachineSearchQuery,
} from '../../adapter/inbound/dtos/search.dto';
import { Potential } from 'src/domain/potential';
import { QueryRunner } from 'typeorm';
import { ImageEntity } from '../../adapter/outbound/repositories/entities/image.entity';
export interface CreateAreaData {
  name: string;
  shape: 'polygon' | 'circle';
  geom: string;
  ownerPoiId: number;
  props?: Record<string, unknown>;
}

// Interface for creating Environment POI
export interface CreateEnvironmentPoiData {
  latitude: number;
  longitude: number;
  name: string;
  address?: string;
  category: number;
  zoneCode: string;
  subzoneCode: string;
  ampCode: string;
  tamCode: string;
  provCode: string;
  nation: string;
  createdBy?: number;
}

// Interface for creating Potential POI
export interface CreatePotentialPoiData {
  layerId: number;
  latitude: number;
  longitude: number;
  potential: {
    name: string;
    address?: string;
    locationType?: string;
    areaType?: string;
    alcoholSale?: number;
    cigaretteSale?: number;
    grade?: string;
    zoneCode: string;
    subzoneCode: string;
    ampCode: string;
    tamCode: string;
    provCode: string;
    nation: string;
    status?: string;
    wfTransactionId?: number;
  };
  seven?: {
    name?: string;
    storeCode?: string;
    investmentType?: string;
    openMonth?: string;
    impactTypeSite?: number;
    impactDetail?: string;
    estimateDateOpen?: string;
    standardLayout?: string;
    storeWidth?: number;
    storeLength?: number;
    saleArea?: number;
    stockArea?: number;
    storeArea?: number;
    parkingCount?: number;
    storeBuildingType?: number;
    storeFranchise?: number;
  };
  vending?: {
    storecode?: string;
    machineId?: string;
    name?: string;
    serialNumber?: string;
    vendingModel?: string;
    vendingType?: number;
    locationAddress?: string;
    contractStartDate?: string;
    contractFinishDate?: string;
    contractCancelDate?: string;
    openDate?: string;
    closeDate?: string;
    targetPoint?: string;
    floor?: number;
    businessTypeCode?: string;
  };
  createdBy?: number;
}

// Interface for the result of creating Potential POI
export interface CreatePotentialPoiResult {
  poi: PoiEntity;
  potentialStore: PoiPotentialEntity;
  sevenEleven?: ElementSevenElevenEntity;
  vendingMachine?: ElementVendingMachineEntity;
}

export interface PopulationData {
  populationProvince: number;
  maleProvince: number;
  femaleProvince: number;
  populationAmphur: number;
  maleAmphur: number;
  femaleAmphur: number;
  populationTambol: number;
  maleTambol: number;
  femaleTambol: number;
  tamName?: string;
  ampName?: string;
  provName?: string;
}

export interface FindPoisByPolygonParam {
  coordinates: [number, number][];
  boundaryArea: [string, string][];
  store: string[] | null;
  storeType:
    | 'sevenEleven'
    | 'competitor'
    | 'potential'
    | 'otherPlace'
    | 'vending'
    | 'permanentClosed'
    | 'sevenImpactCompetitor';
  limit?: number;
  offset?: number;
}

export interface PoiRepositoryPort {
  findPoiLocationByQuery(username: string): Promise<[Poi[], number]>;
  findById(poiId: number): Promise<Poi | null>;
  findOverlappingAreas(polygonWkt: string, excludePoiId: number): Promise<AreaEntity[]>;
  findAreaByPoiId(poiId: number): Promise<AreaEntity | null>;
  createArea(areaData: CreateAreaData): Promise<AreaEntity>;
  updateArea(areaId: number, areaData: Partial<CreateAreaData>): Promise<AreaEntity>;
  findSevenStore(
    params: SevenElevenSearchQuery,
    boundaryArea: [string, string][],
    store: string[],
    limit?: number,
    offset?: number,
  ): Promise<[Poi[], number]>;
  findPoisByPolygon(params: FindPoisByPolygonParam): Promise<[Poi[], number]>;
  findCompetitorStore(
    params: CompetitorSearchQuery,
    boundaryArea: [string, string][],
    limit?: number,
    offset?: number,
  ): Promise<[Poi[], number]>;
  findPotentialStore(
    params: PotentialSearchQuery,
    boundaryArea: [string, string][],
    limit?: number,
    offset?: number,
  ): Promise<[Poi[], number]>;
  findOtherPlace(
    params: OtherPlaceSearchQuery,
    boundaryArea: [string, string][],
    limit?: number,
    offset?: number,
  ): Promise<[Poi[], number]>;
  findClosedSevenEleven(
    params: ClosedStoreSearchQuery,
    boundaryArea: [string, string][],
    limit?: number,
    offset?: number,
  ): Promise<[Poi[], number]>;
  findClosedCompetitor(
    params: ClosedStoreSearchQuery,
    boundaryArea: [string, string][],
    limit?: number,
    offset?: number,
  ): Promise<[Poi[], number]>;
  findVendingMachineStore(
    params: VendingMachineSearchQuery,
    boundaryArea: [string, string][],
    store: string[],
    limit?: number,
    offset?: number,
  ): Promise<[Poi[], number]>;
  findSevenImpactCompetitor(
    params: SevenImpactCompetitorSearchQuery,
    boundaryArea: [string, string][],
    limit?: number,
    offset?: number,
  ): Promise<[Poi[], number]>;
  findSevenElevenNearby(
    lat: number,
    long: number,
    distance: number,
    boundaryArea: [string, string][],
    limit?: number,
    offset?: number,
  ): Promise<[Poi[], number]>;
  findCompetitorNearby(
    lat: number,
    long: number,
    distance: number,
    boundaryArea: [string, string][],
    limit?: number,
    offset?: number,
  ): Promise<[Poi[], number]>;
  findEntertainmentAreaNearby(
    lat: number,
    long: number,
    distance: number,
    boundaryArea: [string, string][],
    limit?: number,
    offset?: number,
  ): Promise<[Poi[], number]>;
  findPoisByPolygonGroupByLayer(
    coordinates: [number, number][],
    boundaryArea: [string, string][],
    limit?: number,
    offset?: number,
  ): Promise<[Poi[], number]>;

  // Create POI methods
  createEnvironmentPoi(data: CreateEnvironmentPoiData): Promise<number>;
  createPotentialPoi(
    data: CreatePotentialPoiData,
    queryRunner?: QueryRunner,
  ): Promise<{ poiId: number; potentialStoreId: number }>;

  // Update POI methods
  updateEnvironmentPoi(
    poiId: number,
    data: Partial<CreateEnvironmentPoiData>,
  ): Promise<PoiEntity>;
  updatePotentialStore(
    potentialStoreId: number,
    data: Potential,
    queryRunner?: QueryRunner,
  ): Promise<void>;
  updateSevenElement(data: Partial<CreatePotentialPoiData['seven']>): Promise<void>;
  updateVendingElement(
    potentialId: number,
    data: Partial<CreatePotentialPoiData['vending']>,
  ): Promise<ElementVendingMachineEntity>;

  // Get POI detail method
  findPoiDetailById(poiId: number): Promise<{
    poi: PoiEntity;
    potentialStore?: PoiPotentialEntity;
    sevenEleven?: ElementSevenElevenEntity;
    vendingMachine?: ElementVendingMachineEntity;
  } | null>;

  // Find zone by coordinates
  findZoneAndSubZoneByCoordinate(
    latitude: number,
    longitude: number,
  ): Promise<MasterCpallZone | null>;

  findPotentialStoreById(id: number): Promise<PoiPotentialEntity>;
  findPotentialsPendingApproval(
    wfId?: number,
    userId?: number,
    poiId?: number,
  ): Promise<PotentialPendingApproval[]>;

  findCompetitorSurroundByUid(seven_poi_uid: string): Promise<[Poi[], number]>;
  // Find POI with zone information
  findPoiById(poiId: number, boundaryArea: [string, string][]): Promise<Poi | null>;
  // Get population data by POI ID
  getPopulationByPoiId(poiId: number): Promise<PopulationData | null>;
  // Update formLocNumber in potential_store
  updatePotentialStoreFormLocNumber(
    poiId: number,
    status: string,
    formLocNumber: string,
  ): Promise<void>;
  // Update element numbers
  updateSevenElevenElementNumber(
    potentialStoreId: number,
    elementNumber: string,
  ): Promise<void>;
  updateVendingMachineElementNumber(
    potentialStoreId: number,
    elementNumber: string,
  ): Promise<void>;
  update(id: number, poi: PoiEntity): Promise<void>;
  saveImages(poiId: number, imageNames: string[], userId: number): Promise<void>;
  findImagesByPoiId(poiId: number): Promise<ImageEntity[]>;
  findImageById(imageId: number): Promise<ImageEntity | null>;
  deleteImage(imageId: number, userId: number): Promise<void>;
}
