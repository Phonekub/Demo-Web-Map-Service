import { Inject, Injectable } from '@nestjs/common';
import { RoleRepositoryPort } from '../../ports/role.repository';
import { PermissionGroup } from '../../../domain/permissionGroup';

@Injectable()
export class GetAllPermissionGroupsUseCase {
  constructor(
    @Inject('RoleRepository')
    private readonly roleRepository: RoleRepositoryPort,
  ) {}

  async execute(language: string = 'th'): Promise<PermissionGroup[]> {
    return this.roleRepository.getAllPermissionGroups(language);
  }
}
