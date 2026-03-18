import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
  validate,
  ValidateNested,
} from 'class-validator';

export class RoundDataDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsString()
  @Length(2, 2)
  start_month: string;

  @IsNotEmpty()
  @IsString()
  @Length(2, 2)
  end_month: string;

  @IsNotEmpty()
  @IsString()
  due_date: string;
}

export class AllocationDto {
  @IsNumber()
  @IsNotEmpty()
  allocation_id: number;

  @IsNumber()
  @IsNotEmpty()
  zone_id: number;

  @IsString()
  @IsNotEmpty()
  zone_code: string;

  @IsNumber()
  @IsNotEmpty()
  assigned_quota: number;

  @IsNumber()
  @IsNotEmpty()
  reserved_quota: number;
}

export class CreateQuotaRoundDto {
  @IsString()
  @IsNotEmpty()
  @Length(4, 4)
  year: string;

  @IsString()
  @IsNotEmpty()
  location_type: string;

  @IsString()
  @IsNotEmpty()
  quota_type: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => RoundDataDto)
  round: RoundDataDto;

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AllocationDto)
  allocations: AllocationDto[];
}
