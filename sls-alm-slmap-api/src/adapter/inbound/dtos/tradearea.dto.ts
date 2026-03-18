import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  ValidateNested,
  IsNotEmpty,
  MaxLength,
  Matches,
  IsNumber,
  IsArray,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Polygon } from 'geojson';
import { TradeareaStatus } from '../../../common/enums/tradearea.enum';

export class GeometryDto {
  @IsString()
  type: 'Polygon';

  @IsArray()
  coordinates: number[][][];
}

export class CreateTradeareaDto {
  @IsNumber()
  @IsNotEmpty()
  poiId: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  refStoreCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  @Matches(/^[A-Z]{2}$/, { message: 'Zone code must be 2 uppercase letters' })
  zoneCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  subzoneCode?: string;

  @IsEnum(TradeareaStatus)
  @IsOptional()
  status?: TradeareaStatus;

  @IsDateString()
  @IsOptional()
  effectiveDate?: string;

  @ValidateNested()
  @Type(() => GeometryDto)
  @IsNotEmpty()
  shape: GeometryDto;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  storeName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  areaColor?: string;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsString()
  @IsOptional()
  warning?: string;

  @IsString()
  @IsOptional()
  createUser?: string;

  @IsString()
  @IsNotEmpty()
  type: string;
}

export class UpdateTradeareaDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  refStoreCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  @Matches(/^[A-Z]{2}$/, { message: 'Zone code must be 2 uppercase letters' })
  zoneCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  subzoneCode?: string;

  @IsEnum(TradeareaStatus)
  @IsOptional()
  status?: TradeareaStatus;

  @IsDateString()
  @IsOptional()
  effectiveDate?: string;

  @ValidateNested()
  @Type(() => GeometryDto)
  @IsOptional()
  shape?: GeometryDto;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  storeName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  areaColor?: string;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsString()
  @IsOptional()
  warning?: string;

  @IsString()
  @IsOptional()
  updateUser?: string;
}

export class FindNearbyDto {
  @IsNumber()
  @Type(() => Number)
  lng: number;

  @IsNumber()
  @Type(() => Number)
  lat: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  radius?: number;
}

export class CheckOverlapDto {
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  shape: Polygon;

  @IsOptional()
  @IsNumber()
  excludeId?: number;

  @IsNotEmpty()
  @IsString()
  tradeareaTypeName: string;
}

export class GetPendingApprovalDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  wfId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  roleId?: number;
}

export class DeleteTradeareaDto {
  @IsNotEmpty()
  @IsString()
  type: string;
}
