import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ProcessAllocationActionDto {
  @IsNumber()
  @Type(() => Number)
  refId: number;

  @IsString()
  actionCode: string;

  @IsOptional()
  @IsString()
  remark?: string;
}
