import {
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  EnvironmentDataDto,
  PotentialDataDto,
  SevenDataDto,
  VendingDataDto,
} from './createPoi.dto';
import { Type } from 'class-transformer';
import { PoiType } from '../../../common/enums/poi.enum';

export class UpdatePoiDto {
  @IsEnum(PoiType)
  @IsNotEmpty()
  type: PoiType;

  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @IsNumber()
  @IsNotEmpty()
  longitude: number;

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
