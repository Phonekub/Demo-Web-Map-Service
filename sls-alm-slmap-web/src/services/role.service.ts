import { get, put, post } from './httpBase.service';
export interface Department {
  deptId: number;
  deptName: string;
}

export interface Level {
  levelId: number;
  levelName: string;
}

export interface Zone {
  zoneCode: string;
  subZonesCode: string[];
}

export interface Permission {
  permissionId: number;
  permissionName: string;
  permissionGroupId: number;
  parentId?: number;
  children?: Permission[];
}

export interface PermissionGroup {
  permissionGroupId: number;
  permissionGroupName: string;
  permissions: Permission[];
}

export interface RolePermissions {
  roleId: number;
  permissionIds: number[];
}

export interface RoleSearch {
  id: number;
  department: string;
  departmentId: number;
  level: string;
  levelId: number;
}

interface DepartmentResponse {
  data: Department[];
}

interface LevelResponse {
  data: Level[];
}

interface ZoneResponse {
  data: Zone[];
}

interface PermissionGroupResponse {
  data: PermissionGroup[];
}

interface RolePermissionsResponse {
  data: RolePermissions;
}

interface RoleSearchResponse {
  data: RoleSearch[];
}

export const getAllDepartment = async (): Promise<DepartmentResponse> => {
  const response = await get<DepartmentResponse>('/role/getalldepartment');
  return response;
};

export const getAllLevels = async (): Promise<LevelResponse> => {
  const response = await get<LevelResponse>('/role/getalllevels');
  return response;
};

export const getAllZones = async (): Promise<ZoneResponse> => {
  const response = await get<ZoneResponse>('/role/getallzones');
  return response;
};

export const getAllPermissionGroups = async (): Promise<PermissionGroupResponse> => {
  const response = await get<PermissionGroupResponse>('/role/getallpermissiongroups');
  return response;
};

export const getRolePermissions = async (
  roleId: number
): Promise<RolePermissionsResponse> => {
  const response = await get<RolePermissionsResponse>(
    `/role/getrolepermissions/${roleId}`
  );
  return response;
};

export const updateRolePermissions = async (
  roleId: number,
  permissionIds: number[],
  permissionType?: string
): Promise<any> => {
  const response = await put<any>('role/updaterolepermissions', {
    roleId,
    permissionIds,
    permissionType,
  });
  return response;
};

export const searchRoles = async (
  departmentId?: string,
  levelId?: string
): Promise<RoleSearchResponse> => {
  const params = new URLSearchParams();
  if (departmentId) params.append('departmentId', departmentId);
  if (levelId) params.append('levelId', levelId);
  const queryString = params.toString() ? `?${params.toString()}` : '';
  const response = await get<RoleSearchResponse>(`/role/search${queryString}`);
  return response;
};

export const createRole = async (
  departmentId: number,
  levelId: number,
  permissionIds: number[],
  permissionType?: string
): Promise<any> => {
  const response = await post<any>('role/create', {
    departmentId,
    levelId,
    permissionIds,
    permissionType,
  });
  return response;
};
