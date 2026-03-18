import { Builder } from 'builder-pattern';
import { UserPermissionEntity } from '../entities/userPermission.entity';
import { UserPermissions } from '../../../../domain/permissions';

export class PermissionsMapper {
  static toDomain(permissionEntity: UserPermissionEntity): UserPermissions {
    return Builder(UserPermissions).code(permissionEntity.permissionCode).build();
  }
}
