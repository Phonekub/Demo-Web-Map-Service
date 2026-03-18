export interface JwtPayload {
  id: number;
  employeeId: string;
  fullName: string;
  departmentId: string;
  levelId: string;
  roleId: number;
  zoneCodes: Record<string, string[]>;
  permissions: string[];
  storeCode: string[] | null;
}

export interface CurrentRole {
  name: string;
  code: string;
}

export interface JwtValue {
  isActive: number;
}
