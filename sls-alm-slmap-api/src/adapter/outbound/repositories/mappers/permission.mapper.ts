import { Permission } from '../../../../domain/permissionGroup';
import { PermissionEntity } from '../entities/permission.entity';

export class PermissionMapper {
  static toDomain(entity: PermissionEntity, language: string = 'th'): Permission {
    const permission = new Permission();
    permission.permissionId = entity.id;
    permission.permissionGroupId = entity.groupId;
    permission.parentId = entity.parentId;

    // Select name based on language
    switch (language.toLowerCase()) {
      case 'en':
        permission.permissionName = entity.nameEn || entity.nameTh || entity.name;
        break;
      case 'km':
      case 'kh':
        permission.permissionName = entity.nameKh || entity.nameTh || entity.name;
        break;
      case 'la':
        permission.permissionName = entity.nameLa || entity.nameTh || entity.name;
        break;
      case 'th':
      default:
        permission.permissionName = entity.nameTh || entity.name;
        break;
    }

    return permission;
  }

  static buildHierarchy(flatPermissions: Permission[]): Permission[] {
    const permissionMap = new Map<number, Permission>();
    const rootPermissions: Permission[] = [];

    // First pass: create map and initialize children arrays
    flatPermissions.forEach((permission) => {
      permission.children = [];
      permissionMap.set(permission.permissionId, permission);
    });

    // Second pass: build hierarchy
    flatPermissions.forEach((permission) => {
      if (permission.parentId) {
        const parent = permissionMap.get(permission.parentId);
        if (parent) {
          parent.children!.push(permission);
        } else {
          // Parent not found, treat as root
          rootPermissions.push(permission);
        }
      } else {
        // No parent, this is a root permission
        rootPermissions.push(permission);
      }
    });

    return rootPermissions;
  }
}
