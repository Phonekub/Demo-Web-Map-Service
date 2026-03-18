import {
  Controller,
  Get,
  Query,
  Param,
  Headers,
  Put,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { GetAllDepartmentUseCase } from '../../../application/usecases/role/getAllDepartment.usecase';
import { GetAllLevelsUseCase } from '../../../application/usecases/role/getAllLevels.usecase';
import { GetAllZonesUseCase } from '../../../application/usecases/role/getAllZones.usecase';
import { GetAllPermissionGroupsUseCase } from '../../../application/usecases/role/getAllPermissionGroups.usecase';
import { GetRolePermissionsUseCase } from '../../../application/usecases/role/getRolePermissions.usecase';
import { UpdateRolePermissionsUseCase } from '../../../application/usecases/role/updateRolePermissions.usecase';
import { CreateRoleUseCase } from '../../../application/usecases/role/createRole.usecase';
import { SearchRolesUseCase } from '../../../application/usecases/role/searchRoles.usecase';
import { UpdateRolePermissionsDto, CreateRoleDto } from '../dtos/rolePermissions.dto';
import { JwtAuthGuard } from '../guards/jwt.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('role')
export class RoleController {
  constructor(
    private readonly getAllDepartmentUseCase: GetAllDepartmentUseCase,
    private readonly getAllLevelsUseCase: GetAllLevelsUseCase,
    private readonly getAllZonesUseCase: GetAllZonesUseCase,
    private readonly getAllPermissionGroupsUseCase: GetAllPermissionGroupsUseCase,
    private readonly getRolePermissionsUseCase: GetRolePermissionsUseCase,
    private readonly updateRolePermissionsUseCase: UpdateRolePermissionsUseCase,
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly searchRolesUseCase: SearchRolesUseCase,
  ) {}

  @Get('getalldepartment')
  async getAllDepartment() {
    const departments = await this.getAllDepartmentUseCase.handler();
    return { data: departments };
  }

  @Get('getalllevels')
  async getAllLevels() {
    const levels = await this.getAllLevelsUseCase.handler();
    return { data: levels };
  }

  @Get('getallzones')
  async getAllZones() {
    const zones = await this.getAllZonesUseCase.handler();
    return { data: zones };
  }

  @Permissions(['PERMISSION_MANAGEMENT'])
  @Get('search')
  async searchRoles(
    @Query('departmentId') departmentId?: string,
    @Query('levelId') levelId?: string,
  ) {
    const deptId = departmentId ? parseInt(departmentId, 10) : undefined;
    const lvlId = levelId ? parseInt(levelId, 10) : undefined;
    const roles = await this.searchRolesUseCase.execute(deptId, lvlId);
    return { data: roles };
  }

  @Permissions(['PERMISSION_MANAGEMENT'])
  @Get('getallpermissiongroups')
  async getAllPermissionGroups(@Headers('language') language?: string) {
    const lang = language?.toLowerCase() || 'th';
    const permissionGroups = await this.getAllPermissionGroupsUseCase.execute(lang);
    return { data: permissionGroups };
  }

  @Permissions(['PERMISSION_MANAGEMENT'])
  @Get('getrolepermissions/:roleId')
  async getRolePermissions(@Param('roleId') roleId: number) {
    const rolePermissions = await this.getRolePermissionsUseCase.handler(roleId);
    return { data: rolePermissions };
  }

  @Permissions(['PERMISSION_MANAGEMENT'])
  @Put('updaterolepermissions')
  async updateRolePermissions(@Body() dto: UpdateRolePermissionsDto) {
    await this.updateRolePermissionsUseCase.handler(
      dto.roleId,
      dto.permissionIds,
      dto.permissionType,
    );
    return { message: 'Permissions updated successfully' };
  }

  @Permissions(['PERMISSION_MANAGEMENT'])
  @Post('create')
  async createRole(@Body() dto: CreateRoleDto) {
    const newRole = await this.createRoleUseCase.execute(
      dto.departmentId,
      dto.levelId,
      dto.permissionIds,
      dto.permissionType,
    );
    return { data: newRole, message: 'Role created successfully' };
  }
}
