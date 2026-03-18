import { Inject, Injectable } from '@nestjs/common';
import { RoleRepositoryPort } from '../../ports/role.repository';
import { RolePermissions } from '../../../domain/rolePermissions';

@Injectable()
export class GetRolePermissionsUseCase {
  constructor(
    @Inject('RoleRepository')
    private readonly roleRepository: RoleRepositoryPort,
  ) {}

  async handler(roleId: number): Promise<RolePermissions> {
    return this.roleRepository.getRolePermissions(roleId);
  }
}
