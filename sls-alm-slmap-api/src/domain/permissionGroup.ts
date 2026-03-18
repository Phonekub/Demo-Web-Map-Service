export class PermissionGroup {
  permissionGroupId: number;
  permissionGroupName: string;
  permissions?: Permission[];
}

export class Permission {
  permissionId: number;
  permissionName: string;
  permissionGroupId: number;
  parentId?: number;
  children?: Permission[];
}
