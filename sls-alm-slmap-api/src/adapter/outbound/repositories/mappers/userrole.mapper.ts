import { Builder } from 'builder-pattern';
import { UserRole } from '../../../../domain/userrole';

export class UserRoleMapper {
  static toDomain(userRoleEntity: UserRole): UserRole {
    return Builder(UserRole)
      .isActive(userRoleEntity.isActive)
      .createBy(userRoleEntity.createBy)
      .createDate(userRoleEntity.createDate)
      .updateBy(userRoleEntity.updateBy)
      .updateDate(userRoleEntity.updateDate)
      .deptId(userRoleEntity.deptId)
      .levelId(userRoleEntity.levelId)
      .orgId(userRoleEntity.orgId)
      .roleId(userRoleEntity.roleId)
      .permissionType(userRoleEntity.permissionType)
      .build();
  }
}
