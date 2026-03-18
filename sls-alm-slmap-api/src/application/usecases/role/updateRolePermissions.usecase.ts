import { Inject, Injectable } from '@nestjs/common';
import { RoleRepositoryPort } from '../../ports/role.repository';

@Injectable()
export class UpdateRolePermissionsUseCase {
  constructor(
    @Inject('RoleRepository')
    private readonly roleRepository: RoleRepositoryPort,
  ) {}

  async handler(
    roleId: number,
    permissionIds: number[],
    permissionType?: string,
  ): Promise<void> {
    return this.roleRepository.updateRolePermissions(
      roleId,
      permissionIds,
      permissionType,
    );
  }
}
