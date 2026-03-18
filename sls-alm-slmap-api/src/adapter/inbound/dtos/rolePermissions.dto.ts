import { IsNotEmpty, IsNumber, IsArray, IsOptional, IsString } from 'class-validator';

export class RolePermissionsDto {
  @IsNumber()
  @IsOptional()
  roleId?: number;

  @IsNumber()
  @IsOptional()
  departmentId?: number;

  @IsNumber()
  @IsOptional()
  levelId?: number;

  @IsArray()
  @IsNotEmpty()
  permissionIds: number[];

  @IsString()
  @IsOptional()
  permissionType?: string;
}

export class UpdateRolePermissionsDto extends RolePermissionsDto {
  @IsNumber()
  @IsNotEmpty()
  declare roleId: number;
}

export class CreateRoleDto extends RolePermissionsDto {
  @IsNumber()
  @IsNotEmpty()
  declare departmentId: number;

  @IsNumber()
  @IsNotEmpty()
  declare levelId: number;
}
