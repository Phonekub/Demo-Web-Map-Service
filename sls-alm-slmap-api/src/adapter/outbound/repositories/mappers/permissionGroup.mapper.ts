import { PermissionGroup, Permission } from '../../../../domain/permissionGroup';
import { PermissionGroupEntity } from '../entities/permissionGroup.entity';
import { PermissionMapper } from './permission.mapper';

export class PermissionGroupMapper {
  static toDomain(
    entity: PermissionGroupEntity,
    language: string = 'th',
  ): PermissionGroup {
    const group = new PermissionGroup();
    group.permissionGroupId = entity.id;

    // Select name based on language
    switch (language.toLowerCase()) {
      case 'en':
        group.permissionGroupName = entity.nameEn || entity.nameTh || entity.name;
        break;
      case 'km':
      case 'kh':
        group.permissionGroupName = entity.nameKh || entity.nameTh || entity.name;
        break;
      case 'la':
        group.permissionGroupName = entity.nameLa || entity.nameTh || entity.name;
        break;
      case 'th':
      default:
        group.permissionGroupName = entity.nameTh || entity.name;
        break;
    }

    if (entity.permissions) {
      const flatPermissions = entity.permissions.map((p) =>
        PermissionMapper.toDomain(p, language),
      );
      group.permissions = PermissionMapper.buildHierarchy(flatPermissions);
    }

    return group;
  }
}
