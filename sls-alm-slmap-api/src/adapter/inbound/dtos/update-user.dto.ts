import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
  IsArray,
  IsNumber,
} from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty()
  isActive: string;

  @IsNumber()
  deptId?: number;

  @IsNumber()
  levelId?: number;

  @IsObject()
  @IsOptional()
  zones?: Record<string, string[]>;

  @IsArray()
  @IsOptional()
  allow_permissions?: string[];

  @IsArray()
  @IsOptional()
  revoke_permissions?: string[];
}
