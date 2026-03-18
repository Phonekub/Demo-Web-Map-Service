import { Inject, Injectable } from '@nestjs/common';
import { RoleRepositoryPort } from '../../ports/role.repository';

@Injectable()
export class GetAllRolesUseCase {
  constructor(
    @Inject('RoleRepository') private readonly roleRepository: RoleRepositoryPort,
  ) {}

  async handler() {
    return await this.roleRepository.getAllRoles();
  }
}
