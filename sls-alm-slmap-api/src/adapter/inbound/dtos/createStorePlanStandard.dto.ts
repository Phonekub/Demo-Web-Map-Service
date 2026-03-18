import { IsOptional, IsString } from 'class-validator';

export class CreateStorePlanStandardDto {
  @IsOptional()
  @IsString()
  filename?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  upload_date?: Date;

  @IsOptional()
  @IsString()
  upload_by?: string;

  @IsOptional()
  @IsString()
  can_load?: string;

  @IsOptional()
  @IsString()
  filepath?: string;
}
