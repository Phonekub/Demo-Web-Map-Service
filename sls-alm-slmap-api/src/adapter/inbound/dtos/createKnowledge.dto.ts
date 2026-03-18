import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

class FileRoleDto {
  @IsNotEmpty()
  @IsString()
  department: string;

  @IsNotEmpty()
  @IsString()
  level: string;

  @IsOptional()
  @IsString()
  role?: string;
}

export class CreateKnowledgeDto {
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  fileName: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  filepath: string;

  @IsNotEmpty()
  @IsString()
  startDate: string;

  @IsNotEmpty()
  @IsString()
  endDate: string;

  @IsNotEmpty()
  @IsString()
  createBy: string;

  @IsNotEmpty()
  @IsString()
  updateBy: string;

  @IsNotEmpty()
  @IsOptional()
  @IsString()
  uploadDate: string;

  @IsNotEmpty()
  @IsOptional()
  @IsString()
  filetype: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileRoleDto)
  // Transform stringified JSON to array of FileRoleDto 
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
  // add for S3 integration
  fileRoles: FileRoleDto[];
}
