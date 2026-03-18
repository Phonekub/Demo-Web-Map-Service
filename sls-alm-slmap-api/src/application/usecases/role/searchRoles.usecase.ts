import { Inject, Injectable } from '@nestjs/common';
import { RoleRepositoryPort } from '../../ports/role.repository';
import { RoleSearch } from '../../../domain/roleSearch';

@Injectable()
export class SearchRolesUseCase {
  constructor(
    @Inject('RoleRepository')
    private readonly roleRepository: RoleRepositoryPort,
  ) {}

  async execute(departmentId?: number, levelId?: number): Promise<RoleSearch[]> {
    return this.roleRepository.searchRoles(departmentId, levelId);
  }
}
