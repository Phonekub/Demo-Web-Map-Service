export interface User {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  isActive: string;
  permissions?: string[];
}

export interface UserWithZones {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  isActive: string;
  email: string;
  zones: string;
}

export interface UserWithZoneListResponse {
  data: UserWithZones[];
  total: number;
}

export interface UserListResponse {
  data: User[];
  total: number;
}

export interface UserListParams {
  page: number;
  pageSize: number;
  search?: string;
}

export interface UserRole {
  userId: string;
  deptId: string;
  levelId: string;
  zones: string[];
}

export interface UserRoleInfo {
  deptId: string;
  levelId: string;
  roleId: string;
}

export interface UserZone {
  zoneCode: string;
  subZonesCode: string[];
}

export interface UserDetailResponse {
  data: {
    userRole: UserRoleInfo;
    userZone: UserZone[];
    userPermissions: string[];
  };
}
