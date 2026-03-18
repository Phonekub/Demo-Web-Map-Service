import {
  IsString,
  IsInt,
  IsOptional,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsArray,
  ValidateNested,
  IsUUID,
  ValidateBy,
  ValidationOptions,
} from 'class-validator';
import { Type } from 'class-transformer';

function IsNumberOrString(validationOptions?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isNumberOrString',
      validator: {
        validate: (value): boolean =>
          typeof value === 'number' || typeof value === 'string',
        defaultMessage: (): string => 'distance must be a number or string',
      },
    },
    validationOptions,
  );
}

export class BackupLocationProfileDto {
  @IsOptional()
  @IsInt()
  profileLayerId?: number;

  @IsOptional()
  @IsNumber()
  backupPercentage?: number;
}

export class BackupLocationProfilePoiDto {
  @IsOptional()
  @IsInt()
  backupLocationProfileId?: number;

  @IsOptional()
  @IsInt()
  poiId?: number;

  @IsOptional()
  @IsInt()
  profileLayerId?: number;

  @IsOptional()
  @IsString()
  distance?: string;

  @IsOptional()
  @IsInt()
  populationAmount?: number;

  @IsOptional()
  @IsInt()
  customerAmount?: number;

  @IsOptional()
  @IsNumber()
  percentPredictCustomer?: number;
}

export class BackupLocationCompetitorDto {
  @IsOptional()
  @IsInt()
  competitorLayerId?: number;

  @IsOptional()
  @IsInt()
  competitorId?: number;

  @IsOptional()
  @IsNumberOrString()
  distance?: number | string;

  @IsOptional()
  @IsInt()
  competitorType?: number;
}

export class CreateBackupProfileDto {
  @IsNotEmpty()
  @IsInt()
  poiId: number;

  @IsNotEmpty()
  @IsInt()
  @IsIn([1, 2])
  poiLayerId: number;

  @IsNotEmpty()
  @IsString()
  strategicLocation: string;

  @IsOptional()
  @IsString()
  formLocNumber?: string;

  @IsOptional()
  @IsString()
  zoneCode?: string;

  @IsOptional()
  @IsString()
  shape?: string;

  @IsOptional()
  @IsInt()
  backupColor?: number;

  @IsOptional()
  @IsString()
  backupColorLayer?: string;

  @IsOptional()
  @IsString()
  @IsIn(['Y', 'N'])
  isActive?: string;

  @IsOptional()
  @IsString()
  mainProfile?: string;

  @IsOptional()
  @IsString()
  subProfile?: string;

  @IsOptional()
  @IsNumber()
  areaSize?: number;

  @IsOptional()
  @IsString()
  backupRemark?: string;

  @IsOptional()
  @IsString()
  strategicSupport?: string;

  @IsOptional()
  @IsString()
  strategicPlace?: string;

  @IsOptional()
  @IsString()
  strategicPlaceOther?: string;

  @IsOptional()
  @IsString()
  strategicPlaceName?: string;

  @IsOptional()
  @IsUUID()
  strategicPlaceGuid?: string;

  @IsOptional()
  @IsString()
  strategicPosition?: string;

  @IsOptional()
  @IsString()
  strategicPositionOther?: string;

  @IsOptional()
  @IsString()
  strategicPositionName?: string;

  @IsOptional()
  @IsString()
  strategicFloor?: string;

  @IsOptional()
  @IsString()
  strategicFloorOther?: string;

  @IsOptional()
  @IsString()
  strategicCustomerType?: string;

  @IsOptional()
  @IsString()
  strategicHousingType?: string;

  @IsOptional()
  @IsString()
  strategicIndustrialEstateName?: string;

  @IsOptional()
  @IsString()
  streetFood?: string;

  @IsOptional()
  @IsInt()
  createBy?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BackupLocationProfileDto)
  profiles?: BackupLocationProfileDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BackupLocationProfilePoiDto)
  profilePois?: BackupLocationProfilePoiDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BackupLocationCompetitorDto)
  competitors?: BackupLocationCompetitorDto[];
}

export class UpdateBackupProfileDto {
  @IsOptional()
  @IsInt()
  poiId?: number;

  @IsOptional()
  @IsInt()
  @IsIn([1, 2])
  poiLayerId?: number;

  @IsOptional()
  @IsString()
  strategicLocation?: string;

  @IsOptional()
  @IsString()
  formLocNumber?: string;

  @IsOptional()
  @IsString()
  zoneCode?: string;

  @IsOptional()
  @IsString()
  shape?: string;

  @IsOptional()
  @IsInt()
  backupColor?: number;

  @IsOptional()
  @IsString()
  backupColorLayer?: string;

  @IsOptional()
  @IsString()
  @IsIn(['Y', 'N'])
  isActive?: string;

  @IsOptional()
  @IsString()
  mainProfile?: string;

  @IsOptional()
  @IsString()
  subProfile?: string;

  @IsOptional()
  @IsNumber()
  areaSize?: number;

  @IsOptional()
  @IsString()
  backupRemark?: string;

  @IsOptional()
  @IsString()
  strategicSupport?: string;

  @IsOptional()
  @IsString()
  strategicPlace?: string;

  @IsOptional()
  @IsString()
  strategicPlaceOther?: string;

  @IsOptional()
  @IsString()
  strategicPlaceName?: string;

  @IsOptional()
  @IsUUID()
  strategicPlaceGuid?: string;

  @IsOptional()
  @IsString()
  strategicPosition?: string;

  @IsOptional()
  @IsString()
  strategicPositionOther?: string;

  @IsOptional()
  @IsString()
  strategicPositionName?: string;

  @IsOptional()
  @IsString()
  strategicFloor?: string;

  @IsOptional()
  @IsString()
  strategicFloorOther?: string;

  @IsOptional()
  @IsString()
  strategicCustomerType?: string;

  @IsOptional()
  @IsString()
  strategicHousingType?: string;

  @IsOptional()
  @IsString()
  strategicIndustrialEstateName?: string;

  @IsOptional()
  @IsString()
  streetFood?: string;

  @IsOptional()
  @IsInt()
  updateBy?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BackupLocationProfileDto)
  profiles?: BackupLocationProfileDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BackupLocationProfilePoiDto)
  profilePois?: BackupLocationProfilePoiDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BackupLocationCompetitorDto)
  competitors?: BackupLocationCompetitorDto[];
}
