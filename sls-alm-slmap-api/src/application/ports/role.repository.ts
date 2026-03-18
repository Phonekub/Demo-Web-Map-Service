import { Department } from '../../domain/department';
import { Level } from '../../domain/level';
import { Zone } from '../../domain/zone';
import { Dropdown } from '../../domain/dropdown';
import { PermissionGroup } from '../../domain/permissionGroup';
import { RolePermissions } from '../../domain/rolePermissions';
import { RoleSearch } from '../../domain/roleSearch';

export interface RoleRepositoryPort {
  getAllDepartment(): Promise<Department[]>;
  getAllLevels(): Promise<Level[]>;
  getAllZones(): Promise<Zone[]>;
  getAllRoles(): Promise<Dropdown[]>;
  searchRoles(departmentId?: number, levelId?: number): Promise<RoleSearch[]>;
  getAllPermissionGroups(language?: string): Promise<PermissionGroup[]>;
  getRolePermissions(roleId: number): Promise<RolePermissions>;
  updateRolePermissions(
    roleId: number,
    permissionIds: number[],
    permissionType?: string,
  ): Promise<void>;
  findByDepartmentAndLevel(departmentId: number, levelId: number): Promise<any>;
  createRole(
    departmentId: number,
    levelId: number,
    permissionIds: number[],
    permissionType?: string,
  ): Promise<any>;
}
