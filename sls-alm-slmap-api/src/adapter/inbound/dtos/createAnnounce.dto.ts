import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

class AnnounceRoleDto {
  @IsOptional()
  @IsString()
  role_id?: string;

  @IsNotEmpty()
  @IsString()
  dept_id: string;

  @IsNotEmpty()
  @IsString()
  level_id: string;
}

export class CreateAnnounceDto {
  @IsNotEmpty()
  @IsString()
  header: string;

  @IsOptional()
  @IsString()
  detail?: string;

  @IsOptional()
  @IsString()
  imagePath?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  isHot?: string;

  @IsOptional()
  @IsString()
  isShow?: string;

  @IsOptional()
  @IsString()
  cmId?: string;

  @IsOptional()
  @IsString()
  contentType?: string;

  @IsOptional()
  @IsString()
  createBy?: string;

  @IsOptional()
  @IsString()
  updateBy?: string;

  @IsOptional()
  @IsString()
  updateDate?: string;

  @IsOptional()
  @IsString()
  createdDate?: string;

  
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnnounceRoleDto)
   @Transform(({ value }) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return [];
        }
      }
      return value;
    })
  roles?: AnnounceRoleDto[];
}
