import { UserRoleEntity } from '../../repositories/entities/userrole.entity';

export interface UserRoleWithRole extends UserRoleEntity {
  roleId: number;
}
