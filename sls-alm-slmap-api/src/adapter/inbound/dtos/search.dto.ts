import {
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsNotEmpty,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// Custom decorator for "at least one required" validation
function IsAtLeastOneWith(properties: string[], validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [properties],
      name: 'isAtLeastOneWith',
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          // If current property has value, validation passes
          if (value !== undefined && value !== null && value !== '') {
            return true;
          }

          // If current property is empty, check if at least one other property has value
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const obj = args.object as any;
          const [propertiesToCheck] = args.constraints as [string[]];
          const hasValue = (val: unknown) => {
            return val !== undefined && val !== null && val !== '';
          };

          return propertiesToCheck.some((prop) => hasValue(obj[prop]));
        },
        defaultMessage(args: ValidationArguments) {
          const [propertiesToCheck] = args.constraints as [string[]];
          return `At least one of ${propertiesToCheck.join(', ')} must be provided`;
        },
      },
    });
  };
}

export enum SearchType {
  SEVEN_ELEVEN = 'sevenEleven',
  COMPETITOR = 'competitor',
  POTENTIAL = 'potential',
  OTHER_PLACE = 'otherPlace',
  CLOSED_STORE = 'closedStore',
  TRAIN_LINE = 'trainLine',
  SEVEN_IMPACT_COMPETITOR = 'sevenImpactCompetitor',
  VENDING_MACHINE = 'vendingMachine',
  TRADE_AREA = 'tradearea',
}

export class BaseSearchQuery {
  @IsEnum(SearchType)
  @IsNotEmpty()
  type: SearchType;

  address?: string;

  countryCode?: string;

  provinceCode?: string;

  districtCode?: string;

  subDistrictCode?: string;

  @IsOptional()
  @Type(() => Number)
  radius?: number;

  @IsOptional()
  @Type(() => Number)
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  long?: number;

  @IsOptional()
  zoneCode?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'false' || value === false) return false;
    if (value === 'true' || value === true) return true;
    return value;
  })
  displayOnMap?: boolean;

  page?: number;

  limit?: number;

  forcedZone?: string;
}

export class SevenElevenSearchQuery extends BaseSearchQuery {
  @IsAtLeastOneWith([
    'text',
    'address',
    'countryCode',
    'provinceCode',
    'districtCode',
    'subDistrictCode',
    'zoneCode',
    'sevenType',
  ])
  text: string;

  sevenType: string;
}

export class CompetitorSearchQuery extends BaseSearchQuery {
  @IsAtLeastOneWith([
    'text',
    'address',
    'countryCode',
    'provinceCode',
    'districtCode',
    'subDistrictCode',
    'textOtherBrand',
  ])
  text?: string;

  @IsOptional()
  @IsString()
  textOtherBrand?: string;
}

export class PotentialSearchQuery extends BaseSearchQuery {
  @IsAtLeastOneWith([
    'text',
    'address',
    'countryCode',
    'provinceCode',
    'districtCode',
    'subDistrictCode',
    'status',
    'rent_type',
  ])
  text?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  rent_type?: string;
}

export class OtherPlaceSearchQuery extends BaseSearchQuery {
  @IsAtLeastOneWith([
    'text',
    'address',
    'countryCode',
    'provinceCode',
    'districtCode',
    'subDistrictCode',
    'layerId',
  ])
  text?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  layerId?: number;
}

export class ClosedStoreSearchQuery extends BaseSearchQuery {
  @IsAtLeastOneWith([
    'text',
    'address',
    'countryCode',
    'provinceCode',
    'districtCode',
    'subDistrictCode',
    'close_type',
    'layerId',
    'areaScope',
  ])
  text?: string;

  @IsOptional()
  @IsString()
  close_type?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  layerId?: number;

  @IsOptional()
  @IsString()
  areaScope?: string;
}

export class TrainLineSearchQuery extends BaseSearchQuery {
  @IsString()
  @IsNotEmpty()
  trainLine: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  showExitGate?: boolean;

  @IsOptional()
  @IsString()
  radiusType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  distanceTime?: number;
}

export class SevenImpactCompetitorSearchQuery extends BaseSearchQuery {
  @IsAtLeastOneWith(['text', 'countryCode', 'provinceCode'])
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  locationType?: string;

  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @IsString()
  subZone?: string;

  @IsOptional()
  @IsString()
  competitorBrand?: string;
}

export class VendingMachineSearchQuery extends BaseSearchQuery {
  @IsAtLeastOneWith([
    'text',
    'countryCode',
    'provinceCode',
    'districtCode',
    'subDistrictCode',
    'address',
    'mainSevenStore',
    'locationType',
    'model',
    'status',
  ])
  text: string;

  mainSevenStore: string;
  locationType: string;
  model: string;

  @IsOptional()
  status?: string;
}

export enum SpatialType {
  SEVEN_ELEVEN = 'sevenEleven',
  TRADE_AREA = 'tradearea',
  FILTER_COMPETITOR = 'filterCompetitor',
  FILTER_PERMANENT_CLOSED = 'filterPermanentClosed',
  FILTER_POTENTIAL = 'filterPotential',
  FILTER_STATION = 'filterStationary',
  FILTER_VENDING = 'filterVending',
  BACKUP_PROFILE = 'backupProfile',
  SEVEN_IMPACT_COMPETITOR = 'filterCompetitorAnalysis',
  DELIVERY_AREA = 'deliveryArea',
  DELIVERY_AREA_DRAFT = 'deliveryAreaDraft',
  DELIVERY_AREA_SCHEDULED = 'deliveryAreaScheduled',
  STORE_HUB = 'storeHub',
  STORE_HUB_DRAFT = 'storeHubDraft',
}

export class SpatialSearchQuery {
  @IsEnum(SpatialType, { each: true })
  @IsNotEmpty()
  spatialType: SpatialType;

  @IsNotEmpty()
  @Type(() => Array)
  coordinates: [number, number][];
}

export class NearbySearchQuery {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  lat: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  long: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  distance: number;
}

export class CompetitorSurroundQuery {
  @IsNotEmpty()
  @IsString()
  seven_poi_uid: string;
}

export class TradeAreaSearchQuery extends BaseSearchQuery {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  approvalType?: string;

  @IsOptional()
  @IsString()
  tradeAreaType?: string;
}
