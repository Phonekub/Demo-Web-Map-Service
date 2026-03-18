import {
  IsString,
  IsOptional,
  IsEnum,
  ValidateNested,
  IsNotEmpty,
  IsNumber,
  ValidateIf,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PoiType } from '../../../common/enums/poi.enum';

// ==================== Environment DTOs ====================

export class EnvironmentDataDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  @IsNotEmpty()
  category: number;

  @IsNumber()
  @IsOptional()
  subCategory?: number;
}

// ==================== Potential DTOs ====================

export class PotentialDataDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  locationType?: string;

  @IsString()
  @IsOptional()
  areaType?: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  alcoholSale?: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  cigaretteSale?: number;

  @IsString()
  @IsOptional()
  grade?: string;
}

export class DimensionDto {
  @IsString()
  @IsOptional()
  width?: string;

  @IsString()
  @IsOptional()
  length?: string;

  @IsString()
  @IsOptional()
  saleArea?: string;

  @IsString()
  @IsOptional()
  stockArea?: string;

  @IsString()
  @IsOptional()
  storeArea?: string;
}

export class SevenDataDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  storeCode?: string;

  @IsString()
  @IsOptional()
  standardLayout?: string;

  @IsString()
  @IsOptional()
  openMonth?: string;

  @IsString()
  @IsOptional()
  estimateDateOpen?: string;

  @IsString()
  @IsOptional()
  impactType?: string;

  @IsString()
  @IsOptional()
  impactDetail?: string;

  @IsString()
  @IsOptional()
  investmentType?: string;

  @IsString()
  @IsOptional()
  shopType?: string;

  @ValidateNested()
  @Type(() => DimensionDto)
  @IsOptional()
  dimension?: DimensionDto;

  @IsString()
  @IsOptional()
  parkingCount?: string;

  @IsString()
  @IsOptional()
  storeBuildingType?: string;

  @IsString()
  @IsOptional()
  storeFranchise?: string;
}

export class VendingDataDto {
  @IsString()
  @IsOptional()
  businessTypeCode?: string;

  @IsString()
  @IsOptional()
  parentBranchCode?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  serialNumber?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsOptional()
  installationType?: number;

  @IsNumber()
  @IsOptional()
  vendingType?: number;

  @IsString()
  @IsOptional()
  position?: string;

  @IsString()
  @IsOptional()
  targetPoint?: string;

  @IsString()
  @IsOptional()
  floor?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  locationAddress?: string;

  @IsOptional()
  contractStartDate?: string;

  @IsOptional()
  contractEndDate?: string;

  @IsOptional()
  contractCancelDate?: string;

  @IsOptional()
  serviceStartDate?: string;

  @IsOptional()
  serviceEndDate?: string;

  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsNumber()
  potentialStoreId?: number;

  @IsOptional()
  @IsString()
  machineId?: string;

  @IsOptional()
  @IsString()
  vendingCode?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  motherStoreName?: string;
}

// ==================== Main Create POI DTO ====================

export class CreatePoiDto {
  @IsEnum(PoiType)
  @IsNotEmpty()
  type: PoiType;

  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @IsString()
  @IsNotEmpty()
  subzone: string;

  @IsString()
  @IsNotEmpty()
  zone: string;

  // Environment data - required when type is 'environment'
  @ValidateIf((o) => o.type === PoiType.ENVIRONMENT)
  @ValidateNested()
  @Type(() => EnvironmentDataDto)
  @IsNotEmpty()
  environment?: EnvironmentDataDto;

  // Potential data - required when type is 'potential'
  @ValidateIf((o) => o.type === PoiType.POTENTIAL)
  @ValidateNested()
  @Type(() => PotentialDataDto)
  @IsNotEmpty()
  potential?: PotentialDataDto;

  // Seven-Eleven data - optional for potential type
  @ValidateIf((o) => o.type === PoiType.POTENTIAL)
  @ValidateNested()
  @Type(() => SevenDataDto)
  @IsOptional()
  seven?: SevenDataDto;

  // Vending machine data - optional for potential type
  @ValidateIf((o) => o.type === PoiType.POTENTIAL)
  @ValidateNested()
  @Type(() => VendingDataDto)
  @IsOptional()
  vending?: VendingDataDto;
}
